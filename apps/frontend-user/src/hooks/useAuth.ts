import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/utils/supabase'
import { User } from '@supabase/supabase-js'

// ゲストユーザー用のメールアドレスと暗号化されたパスワードを生成
const generateGuestCredentials = () => {
  const timestamp = new Date().getTime()
  const random = Math.random().toString(36).substring(2, 15)
  return {
    email: `guest_${timestamp}_${random}@healthle.temp`,
    password: `guest_${timestamp}_${random}_${Math.random().toString(36).substring(2, 15)}`
  }
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuestUser, setIsGuestUser] = useState(false)
  const [authError, setAuthError] = useState<Error | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    let mounted = true
    console.log('Auth hook initialized')

    const initializeAuth = async () => {
      if (!mounted) return

      try {
        console.log('Checking session...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          throw error
        }

        if (!session?.user) {
          console.log('No active session')
          if (mounted) {
            setUser(null)
            setIsGuestUser(false)
            setLoading(false)
          }
          return
        }

        console.log('Session found:', session.user.id)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          console.error('User data error:', userError)
          if (userError.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('users')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                created_at: new Date().toISOString()
              }])
              .single()

            if (insertError) {
              throw insertError
            }
          } else {
            throw userError
          }
        }

        if (mounted) {
          const userWithMetadata = {
            ...session.user,
            ...userData,
            is_guest: userData?.is_guest ?? false
          }
          setUser(userWithMetadata)
          setIsGuestUser(userData?.is_guest ?? false)
          setLoading(false)
          setAuthError(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setUser(null)
          setIsGuestUser(false)
          setLoading(false)
          setAuthError(error as Error)
          await supabase.auth.signOut()
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await initializeAuth()
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null)
          setIsGuestUser(false)
          setLoading(false)
          setAuthError(null)
        }
      }
    })

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setAuthError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Login error:', error)
      setAuthError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginAsGuest = async () => {
    try {
      setLoading(true)
      setAuthError(null)

      // ゲストユーザーの認証情報を生成
      const { email, password } = generateGuestCredentials()

      // ゲストユーザーを作成
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_guest: true
          }
        }
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('ゲストユーザーの作成に失敗しました')

      // ユーザーデータを作成
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: signUpData.user.id,
          email: email,
          is_guest: true,
          created_at: new Date().toISOString()
        }])

      if (insertError) throw insertError

      // 自動的にログイン
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      return signInData
    } catch (error) {
      console.error('Guest login error:', error)
      setAuthError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setIsGuestUser(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      setAuthError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    isGuestUser,
    authError,
    login,
    logout,
    loginAsGuest
  }
} 