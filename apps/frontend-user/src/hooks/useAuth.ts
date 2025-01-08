import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Provider, User as SupabaseUser, Session, WeakPassword } from '@supabase/supabase-js'

// シングルトンインスタンスを作成
const supabase = createClientComponentClient()

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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        console.log('Session status:', session ? 'Found' : 'Not found')
        
        if (session?.user) {
          console.log('Fetching user data...')
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userError) {
            console.error('User data error:', userError)
            throw userError
          }

          console.log('User data fetched successfully')
          setUser(userData)
        } else {
          console.log('No session found, setting user to null')
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        console.log('Auth initialization completed')
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      if (session?.user) {
        console.log('Fetching updated user data...')
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          console.error('User data error on state change:', userError)
          setUser(null)
        } else {
          console.log('User data updated successfully')
          setUser(userData)
        }
      } else {
        console.log('No session in state change, setting user to null')
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
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

  const login = async () => {
    try {
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