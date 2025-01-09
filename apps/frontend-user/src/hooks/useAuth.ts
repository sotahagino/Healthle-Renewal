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
  refreshUserData: () => Promise<void>;
};

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [authError, setAuthError] = useState<Error | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  // ゲストユーザー情報の永続化
  const GUEST_USER_KEY = 'healthle_guest_user'
  const PREVIOUS_GUEST_ID_KEY = 'healthle_previous_guest_id'

  const saveGuestUser = (guestUser: CustomUser) => {
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser))
  }

  const getStoredGuestUser = (): CustomUser | null => {
    const stored = localStorage.getItem(GUEST_USER_KEY)
    return stored ? JSON.parse(stored) : null
  }

  const clearGuestUser = () => {
    localStorage.removeItem(GUEST_USER_KEY)
    localStorage.removeItem(PREVIOUS_GUEST_ID_KEY)
  }

  const refreshUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError
        if (userData) {
          console.log('Refreshed user data:', userData)
          setUser(userData)
          // ゲストユーザーの場合は情報を永続化
          if (userData.is_guest) {
            saveGuestUser(userData)
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
      setAuthError(error instanceof Error ? error : new Error('ユーザーデータの更新に失敗しました'))
    }
  }

  const getProjectRef = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const match = url.match(/(?:https:\/\/)?([^.]+)/)
    return match ? match[1] : ''
  }

  const initializeAuth = async () => {
    try {
      setLoading(true)
      console.log('Initializing auth...')
      
      // 既存のゲストユーザー情報を確認
      const storedGuest = getStoredGuestUser()
      if (storedGuest) {
        setUser(storedGuest)
        setIsGuest(true)
        setLoading(false)
        return
      }
      
      const projectRef = getProjectRef()
      const storedSession = localStorage.getItem(`sb-${projectRef}-auth-token`)
      console.log('Stored session:', storedSession ? 'Found' : 'Not found')

      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession)
          const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token
          })
          
          if (restoredSession?.user && !restoreError) {
            await refreshUserData()
            return
          }
        } catch (error) {
          console.error('Failed to restore session:', error)
          localStorage.removeItem(`sb-${projectRef}-auth-token`)
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError

      if (session?.user) {
        await refreshUserData()
        
        const { data: refreshedSession } = await supabase.auth.refreshSession()
        if (refreshedSession?.session) {
          console.log('Session refreshed successfully')
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
        setUser(null)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setUser(null)
      setAuthError(error instanceof Error ? error : new Error('認証の初期化に失敗しました'))
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    let mounted = true
    let authSubscription: { unsubscribe: () => void } | null = null

    const setupAuthSubscription = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (!mounted) return

        if (session?.user) {
          await refreshUserData()
        } else {
          setUser(null)
        }
      })

      authSubscription = subscription
    }

    const initialize = async () => {
      if (!isInitialized) {
        await initializeAuth()
        if (mounted) {
          setupAuthSubscription()
        }
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
  }, [isInitialized])

  const loginAsGuest = async () => {
    try {
      // 既存のゲストユーザー情報を確認
      const storedGuest = getStoredGuestUser()
      if (storedGuest) {
        try {
          // 既存のゲストユーザーでログイン試行
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: storedGuest.email ?? '',
            password: `guest_${storedGuest.id ?? 'default'}`,
          })

          if (!signInError && signInData.user) {
            setUser(storedGuest)
            setIsGuest(true)
            return { user: storedGuest }
          }
        } catch (error) {
          console.error('Failed to restore guest session:', error)
          clearGuestUser()
        }
      }

      // 新規ゲストユーザーの作成
      const timestamp = Date.now()
      const guestEmail = `guest_${timestamp}@example.com`
      const guestPassword = `guest_${timestamp}_${Math.random().toString(36).substring(7)}`

      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
      })

      if (signUpError) throw signUpError

      if (authUser) {
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authUser.id,
            email: guestEmail,
            is_guest: true,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single()

        if (insertError) throw insertError

        // ゲストユーザー情報を永続化
        saveGuestUser(userData)
        setUser(userData)
        setIsGuest(true)
        return { user: userData }
      }
    } catch (error) {
      console.error('Guest login error:', error)
      throw error
    }
  }

  const migrateGuestData = async (oldUserId: string, newUserId: string) => {
    try {
      console.log('Migrating guest data:', { oldUserId, newUserId })

      // vendor_ordersの更新
      const { error: ordersError } = await supabase
        .from('vendor_orders')
        .update({ user_id: newUserId })
        .eq('user_id', oldUserId)

      if (ordersError) {
        console.error('Error updating vendor_orders:', ordersError)
        throw ordersError
      }

      // consultationsの更新
      const { error: consultationsError } = await supabase
        .from('consultations')
        .update({ user_id: newUserId })
        .eq('user_id', oldUserId)

      if (consultationsError) {
        console.error('Error updating consultations:', consultationsError)
        throw consultationsError
      }

      // ゲストユーザー情報の更新
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          migrated_to: newUserId,
          migrated_at: new Date().toISOString(),
          migration_status: 'completed'
        })
        .eq('id', oldUserId)

      if (userUpdateError) {
        console.error('Error updating user migration status:', userUpdateError)
        throw userUpdateError
      }

      console.log('Successfully migrated guest data to regular account')
      clearGuestUser()
    } catch (error) {
      console.error('Error migrating guest data:', error)
      throw error
    }
  }

  const login = async () => {
    try {
      // 現在のゲストユーザー情報を保存
      const currentUser = user || getStoredGuestUser()
      if (currentUser?.is_guest) {
        localStorage.setItem(PREVIOUS_GUEST_ID_KEY, currentUser.id)
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'line' as Provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/line/callback`,
        },
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // LINE認証コールバック後のデータ移行処理
  useEffect(() => {
    const migratePreviousGuestData = async () => {
      const previousGuestId = localStorage.getItem(PREVIOUS_GUEST_ID_KEY)
      
      if (previousGuestId && user && !user.is_guest) {
        try {
          await migrateGuestData(previousGuestId, user.id)
          localStorage.removeItem(PREVIOUS_GUEST_ID_KEY)
        } catch (error) {
          console.error('Failed to migrate guest data:', error)
          setAuthError(error instanceof Error ? error : new Error('ゲストデータの移行に失敗しました'))
        }
      }
    }

    if (user && !loading) {
      migratePreviousGuestData()
    }
  }, [user, loading])

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clearGuestUser()
      setUser(null)
      setIsGuest(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const migrateGuestToRegular = async () => {
    try {
      if (!user?.is_guest) return

      const { data, error } = await supabase
        .from('users')
        .update({ is_guest: false })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setUser(data)
        setIsGuest(false)
        clearGuestUser()
      }
    } catch (error) {
      console.error('Error migrating guest to regular:', error)
      throw error
    }
  }

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
    refreshUserData,
  }
} 