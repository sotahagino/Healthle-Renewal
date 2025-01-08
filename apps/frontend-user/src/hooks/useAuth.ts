import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Provider, User as SupabaseUser } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'

interface CustomUser extends SupabaseUser {
  is_guest: boolean;
  [key: string]: any;
}

export type AuthContextType = {
  user: CustomUser | null;
  loading: boolean;
  login: () => Promise<{ provider: Provider; url: string }>;
  loginAsGuest: () => Promise<{ user: any } | undefined>;
  logout: () => Promise<void>;
  isGuest: boolean;
  isGuestUser: boolean;
  authError: Error | null;
  migrateGuestToRegular: () => Promise<void>;
};

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [authError, setAuthError] = useState<Error | null>(null)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    let mounted = true
    let authSubscription: { unsubscribe: () => void } | null = null

    const getProjectRef = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const match = url.match(/(?:https:\/\/)?([^.]+)/)
      return match ? match[1] : ''
    }

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // ローカルストレージからセッションを確認
        const projectRef = getProjectRef()
        const storedSession = localStorage.getItem(`sb-${projectRef}-auth-token`)
        console.log('Stored session:', storedSession ? 'Found' : 'Not found')

        // まずストアされたセッションを試す
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession)
            const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
              access_token: parsedSession.access_token,
              refresh_token: parsedSession.refresh_token
            })
            
            if (restoredSession?.user && !restoreError) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', restoredSession.user.id)
                .single()
              
              if (userData) {
                console.log('Restored session and user data')
                setUser(userData)
                setLoading(false)
                return
              }
            }
          } catch (error) {
            console.error('Failed to restore session:', error)
            localStorage.removeItem(`sb-${projectRef}-auth-token`)
          }
        }

        // セッションの取得を試みる
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!mounted) return

        console.log('Session status:', session ? 'Found' : 'Not found')
        console.log('Session data:', session)
        
        if (session?.user) {
          console.log('Fetching user data for ID:', session.user.id)
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userError) {
            console.error('User data error:', userError)
            setUser(session.user as CustomUser)
            setLoading(false)
            return
          }

          if (!mounted) return

          console.log('Setting initial user data:', userData)
          setUser(userData)
          
          // セッションの再確認と更新
          const { data: refreshedSession } = await supabase.auth.refreshSession()
          if (refreshedSession?.session) {
            console.log('Session refreshed successfully')
            // セッションをローカルストレージに保存
            const sessionData = {
              access_token: refreshedSession.session.access_token,
              refresh_token: refreshedSession.session.refresh_token,
              expires_at: Math.floor(Date.now() / 1000) + refreshedSession.session.expires_in,
              expires_in: refreshedSession.session.expires_in,
              token_type: 'bearer',
              user: refreshedSession.session.user
            }
            localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(sessionData))
          }
        } else {
          console.log('No session found, setting user to null')
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setUser(null)
          setAuthError(error instanceof Error ? error : new Error('認証の初期化に失敗しました'))
        }
      } finally {
        if (mounted) {
          console.log('Auth initialization completed')
          setLoading(false)
        }
      }
    }

    const setupAuthSubscription = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (!mounted) return

        if (session?.user) {
          try {
            console.log('Fetching user data on auth state change for ID:', session.user.id)
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userError) {
              console.error('User data error on state change:', userError)
              setUser(session.user as CustomUser)
              setLoading(false)
              return
            }

            if (!mounted) return

            console.log('Setting updated user data from subscription:', userData)
            setUser(userData)
            setLoading(false)
          } catch (error) {
            console.error('Error updating user data:', error)
            setLoading(false)
          }
        } else {
          console.log('No session in state change, setting user to null')
          setUser(null)
          setLoading(false)
        }
      })

      authSubscription = subscription
    }

    const initialize = async () => {
      try {
        await initializeAuth()
        if (mounted) {
          setupAuthSubscription()
        }
      } catch (error) {
        console.error('Initialization error:', error)
        setLoading(false)
      }
    }

    initialize()

    return () => {
      mounted = false
      if (authSubscription) {
        console.log('Cleaning up auth subscription')
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const loginAsGuest = async () => {
    try {
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email: `guest_${Date.now()}@example.com`,
        password: `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      })

      if (signUpError) throw signUpError

      if (authUser) {
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authUser.id,
            is_guest: true,
          }])
          .select()
          .single()

        if (insertError) throw insertError
        setUser(userData)
        return { user: userData }
      }
    } catch (error) {
      console.error('Guest login error:', error)
      throw error
    }
  }

  const migrateGuestData = async (oldUserId: string, newUserId: string) => {
    try {
      // vendor_ordersテーブルの更新
      const { error: ordersError } = await supabase
        .from('vendor_orders')
        .update({ user_id: newUserId })
        .eq('user_id', oldUserId);

      if (ordersError) throw ordersError;

      // consultationsテーブルの更新
      const { error: consultationsError } = await supabase
        .from('consultations')
        .update({ user_id: newUserId })
        .eq('user_id', oldUserId);

      if (consultationsError) throw consultationsError;

      console.log('Successfully migrated guest data to regular account');
    } catch (error) {
      console.error('Error migrating guest data:', error);
      throw error;
    }
  };

  const login = async () => {
    try {
      // ゲストユーザーのIDを保存
      const currentUserId = user?.id;
      const wasGuest = user?.is_guest;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'line' as Provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/line/callback`,
        },
      });

      if (error) throw error;

      // ログイン後のコールバックで使用するためにローカルストレージに保存
      if (wasGuest && currentUserId) {
        localStorage.setItem('previousGuestId', currentUserId);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // LINE認証コールバック後のデータ移行処理
  useEffect(() => {
    const migratePreviousGuestData = async () => {
      const previousGuestId = localStorage.getItem('previousGuestId');
      
      if (previousGuestId && user && !user.is_guest) {
        try {
          await migrateGuestData(previousGuestId, user.id);
          localStorage.removeItem('previousGuestId');
        } catch (error) {
          console.error('Failed to migrate guest data:', error);
          setAuthError(error instanceof Error ? error : new Error('ゲストデータの移行に失敗しました'));
        }
      }
    };

    if (user && !loading) {
      migratePreviousGuestData();
    }
  }, [user, loading]);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const migrateGuestToRegular = async () => {
    try {
      if (!user || !user.is_guest) return;
      const { data, error } = await supabase
        .from('users')
        .update({ is_guest: false })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUser(prev => prev ? { ...prev, is_guest: false } : null);
    } catch (error) {
      console.error('Error migrating guest to regular user:', error);
      setAuthError(error instanceof Error ? error : new Error('Failed to migrate user'));
    }
  };

  return {
    user,
    loading,
    login,
    loginAsGuest,
    logout,
    isGuest,
    isGuestUser: user?.is_guest ?? false,
    authError,
    migrateGuestToRegular,
  }
} 