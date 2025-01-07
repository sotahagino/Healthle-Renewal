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
        console.log('Initializing auth...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (!session?.user) {
          console.log('No active session, checking local storage')
          if (mounted) {
            // セッションエラー時にローカルストレージからゲストユーザー情報を確認
            const guestInfo = getGuestUserInfo()
            if (guestInfo && typeof guestInfo.email === 'string' && typeof guestInfo.password === 'string') {
              console.log('Found guest info in local storage, attempting to sign in')
              try {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                  email: guestInfo.email,
                  password: guestInfo.password
                })
                
                if (signInError || !signInData.user) {
                  console.error('Guest sign in failed:', signInError)
                  clearGuestUserInfo()
                  if (mounted) {
                    setUser(null)
                    setLoading(false)
                  }
                  return
                }

                console.log('Successfully signed in as guest:', signInData.user)

                // ユーザー情報をデータベースから取得
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', signInData.user.id)
                  .single()

                if (userError) {
                  console.error('Failed to fetch user data:', userError)
                  if (mounted) {
                    setUser(signInData.user)
                    setLoading(false)
                  }
                  return
                }

                if (mounted && userData) {
                  console.log('Successfully fetched user data:', userData)
                  setUser({
                    ...signInData.user,
                    is_guest: userData.is_guest,
                    guest_created_at: userData.guest_created_at
                  })
                  setLoading(false)
                }
              } catch (reAuthError) {
                console.error('Re-authentication failed:', reAuthError)
                clearGuestUserInfo()
                if (mounted) {
                  setUser(null)
                  setLoading(false)
                }
              }
            } else {
              console.log('No guest info found')
              setUser(null)
              setLoading(false)
            }
          }
          return
        }

        // アクティブなセッションがある場合
        if (mounted) {
          console.log('Active session found:', session)
          // ユーザー情報をデータベースから取得
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!userError && userData) {
            console.log('Setting user data with database info:', userData)
            setUser({
              ...session.user,
              is_guest: userData.is_guest,
              guest_created_at: userData.guest_created_at
            })
          } else {
            console.log('Setting session user without database info:', session.user)
            setUser(session.user)
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

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session })
      
      if (!mounted) return

      if (!session?.user) {
        console.log('No user in session after state change')
        setUser(null)
        setLoading(false)
        return
      }

      try {
        // ユーザー情報をデータベースから取得
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!userError && userData) {
          console.log('Auth state change: setting user data with database info:', userData)
          setUser({
            ...session.user,
            is_guest: userData.is_guest,
            guest_created_at: userData.guest_created_at
          })
        } else {
          console.log('Auth state change: setting session user without database info:', session.user)
          setUser(session.user)
        }
      } catch (error) {
        console.error('Error fetching user data after state change:', error)
        setUser(session.user)
      } finally {
        setLoading(false)
      }
    })

    // 初期化を実行
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  // ゲストユーザーかどうかを確認
  const isGuestUser = user?.is_guest === true || (user?.email && user.email.includes('@guest.healthle.com')) || false;

  // ゲストアカウントを正規アカウントに移行
  const migrateGuestToRegular = async (newUserId: string) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    const migrate = async (): Promise<boolean> => {
      try {
        console.log('Starting guest user migration:', {
          guestUserId: user?.id,
          newUserId: newUserId,
          attempt: retryCount + 1
        });

        // データベースからゲストユーザー情報を取得
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('is_guest', true)
          .eq('id', user?.id)
          .single();

        if (userError) {
          console.error('Failed to find guest user:', userError);
          throw new Error('Guest user not found in database');
        }

        const guestUserId = userData.id;

        // vendor_ordersテーブルのユーザーIDを更新
        const { error: orderUpdateError } = await supabase
          .from('vendor_orders')
          .update({ user_id: newUserId })
          .eq('user_id', guestUserId);

        if (orderUpdateError) {
          console.error('Failed to update vendor_orders:', orderUpdateError);
          throw orderUpdateError;
        }

        // consultationsテーブルのユーザーIDを更新
        const { error: consultationUpdateError } = await supabase
          .from('consultations')
          .update({ user_id: newUserId })
          .eq('user_id', guestUserId);

        if (consultationUpdateError) {
          console.error('Failed to update consultations:', consultationUpdateError);
          throw consultationUpdateError;
        }

        // ユーザーの移行状態を更新
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            migrated_to: newUserId,
            migrated_at: new Date().toISOString(),
            migration_status: 'completed',
            is_guest: false // ゲストフラグを更新
          })
          .eq('id', guestUserId);

        if (userUpdateError) {
          console.error('Failed to update user migration status:', userUpdateError);
          throw userUpdateError;
        }

        console.log('Migration completed successfully:', {
          guestUserId,
          newUserId,
          migratedAt: new Date().toISOString()
        });

        // ゲストユーザー情報をクリア
        clearGuestUserInfo();

        return true;
      } catch (error) {
        console.error('Migration attempt failed:', {
          attempt: retryCount + 1,
          error
        });
        return false;
      }
    };

    while (retryCount < MAX_RETRIES) {
      const success = await migrate();
      if (success) {
        // 成功時にユーザー情報を更新
        setUser(null);
        return;
      }

      retryCount++;
      if (retryCount < MAX_RETRIES) {
        // 指数バックオフでリトライ
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log(`Retrying migration in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Migration failed after ${MAX_RETRIES} attempts`);
  };

  // ログイン処理
  const login = async (email: string, password: string) => {
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
  }

  // ログアウト処理
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
        console.error('Failed to create guest user in database:', userError)
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

  return {
    user,
    loading,
    setUser,
    login,
    logout,
    isGuestUser,
    migrateGuestToRegular,
    loginAsGuest
  }
} 