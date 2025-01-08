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

    const initializeAuth = async () => {
      if (!mounted) return

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          throw error
        }

        if (!session?.user) {
          if (mounted) {
            setUser(null)
            setIsGuestUser(false)
            setLoading(false)
          }
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          throw userError
        }

        if (mounted) {
          setUser(session.user)
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
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
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setAuthError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // セッションを確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('セッションの取得に失敗しました')

      // ユーザーデータを取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') throw userError

      setUser(data.user)
      setIsGuestUser(userData?.is_guest ?? false)
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

      setUser(signInData.user)
      setIsGuestUser(true)
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

  const migrateGuestToRegular = async (email: string, password: string) => {
    try {
      setLoading(true)
      setAuthError(null)

      if (!user || !isGuestUser) {
        throw new Error('ゲストユーザーでログインしている必要があります')
      }

      // メールアドレスとパスワードを更新
      const { data, error } = await supabase.auth.updateUser({
        email,
        password
      })

      if (error) throw error
      if (!data.user) throw new Error('ユーザー情報の更新に失敗しました')

      // セッションを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) throw new Error('セッションの取得に失敗しました')

      // ユーザーデータを更新
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email,
          is_guest: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setUser(data.user)
      setIsGuestUser(false)
      return { user: data.user, session }
    } catch (error) {
      console.error('Migration error:', error)
      setAuthError(error as Error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const initiateLineLogin = () => {
    try {
      // ランダムなstateを生成
      const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // stateをLocalStorageに保存
      localStorage.setItem('line_login_state', state);

      // LINE認証URLの構築
      const lineLoginUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/line`);
      lineLoginUrl.searchParams.append('state', state);
      lineLoginUrl.searchParams.append('return_url', window.location.pathname);

      // LINE認証ページへリダイレクト
      window.location.href = lineLoginUrl.toString();
    } catch (error) {
      console.error('LINE login initialization error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    isGuestUser,
    authError,
    login,
    logout,
    loginAsGuest,
    migrateGuestToRegular,
    initiateLineLogin
  }
} 