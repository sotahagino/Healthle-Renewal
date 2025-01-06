import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  generateGuestEmail, 
  generateGuestPassword, 
  saveGuestUserInfo, 
  getGuestUserInfo, 
  clearGuestUserInfo 
} from '@/lib/guest-utils'

export function useAuth() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            // セッションエラー時にローカルストレージからゲストユーザー情報を確認
            const guestInfo = getGuestUserInfo()
            if (guestInfo && typeof guestInfo.email === 'string' && typeof guestInfo.password === 'string') {
              // 自動再ログイン試行
              try {
                const { data: reAuthData, error: reAuthError } = await supabase.auth.signInWithPassword({
                  email: guestInfo.email,
                  password: guestInfo.password
                })
                
                if (!reAuthError && reAuthData.user) {
                  const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', reAuthData.user.id)
                    .single()

                  if (userData) {
                    setUser({
                      ...reAuthData.user,
                      is_guest: userData.is_guest,
                      guest_created_at: userData.guest_created_at
                    })
                    setLoading(false)
                    return
                  }
                }
              } catch (reAuthError) {
                console.error('Re-authentication failed:', reAuthError)
              }
            }
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          if (session?.user) {
            // ユーザー情報をデータベースから取得
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (!userError && userData) {
              // セッションのユーザー情報にデータベースの情報を統合
              setUser({
                ...session.user,
                is_guest: userData.is_guest,
                guest_created_at: userData.guest_created_at
              })
            } else {
              setUser(session.user)
            }
          } else {
            setUser(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session })
      
      if (mounted) {
        if (session?.user) {
          // ユーザー情報をデータベースから取得
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!userError && userData) {
            // セッションのユーザー情報にデータベースの情報を統合
            setUser({
              ...session.user,
              is_guest: userData.is_guest,
              guest_created_at: userData.guest_created_at
            })
          } else {
            setUser(session.user)
          }
        } else {
          setUser(null)
          const protectedPaths = ['/mypage', '/consultations', '/result']
          const currentPath = window.location.pathname
          if (protectedPaths.some(path => currentPath.startsWith(path))) {
            router.push('/login')
          }
        }
        setLoading(false)
      }
    })

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // ゲストユーザーとしてログイン
  const loginAsGuest = async () => {
    try {
      const email = generateGuestEmail()
      const password = generateGuestPassword()

      // まずSupabase認証でユーザーを作成
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            is_guest: true,
            guest_created_at: new Date().toISOString()
          }
        }
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('ユーザー作成に失敗しました')

      // 次にusersテーブルにゲストユーザー情報を追加
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: signUpData.user.id,
          email: email,
          is_guest: true,
          guest_created_at: new Date().toISOString()
        }])

      if (userError) {
        // usersテーブルへの挿入に失敗した場合、認証ユーザーを削除
        await supabase.auth.admin.deleteUser(signUpData.user.id)
        throw userError
      }

      // ゲストユーザー情報をローカルストレージに保存
      saveGuestUserInfo(signUpData.user.id, email, password)
      
      // ユーザー情報を設定
      const userWithMetadata = {
        ...signUpData.user,
        is_guest: true,
        guest_created_at: new Date().toISOString()
      }
      setUser(userWithMetadata)
      return userWithMetadata

    } catch (error) {
      console.error('Guest login error:', error)
      throw error
    }
  }

  // ゲストユーザーかどうかを確認
  const isGuestUser = () => {
    // データベースの情報を優先
    return user?.is_guest === true
  }

  // ゲストアカウントを正規アカウントに移行
  const migrateGuestToRegular = async (newUserId: string) => {
    try {
      // データベースからゲストユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('is_guest', true)
        .eq('id', user?.id)
        .single()

      if (userError) throw new Error('Guest user not found in database')
      const guestUserId = userData.id

      // 各テーブルのユーザーIDを更新
      const tables = ['consultations', 'orders', 'vendor_orders']
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .update({ user_id: newUserId })
          .eq('user_id', guestUserId)

        if (error) throw error
      }

      // ゲストユーザー情報をクリア
      clearGuestUserInfo()

    } catch (error) {
      console.error('Migration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // ブラウザのストレージをクリア
      window.sessionStorage.clear()
      window.localStorage.clear()

      // セッションクッキーを削除
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=')
        const cookieName = name.trim()
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`
      })

      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    setUser,
    loginAsGuest,
    isGuestUser,
    migrateGuestToRegular,
    login: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setUser(data.user)
      } catch (error) {
        console.error('Login error:', error)
        throw error
      }
    },
    logout
  }
} 