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
        
        if (error || !session?.user) {
          console.log('No active session or error, checking local storage:', error)
          if (mounted) {
            // セッションエラー時にローカルストレージからゲストユーザー情報を確認
            const guestInfo = getGuestUserInfo()
            if (guestInfo && typeof guestInfo.email === 'string' && typeof guestInfo.password === 'string') {
              console.log('Found guest info in local storage, attempting to sign in')
              // 自動再ログイン試行
              try {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                  email: guestInfo.email,
                  password: guestInfo.password
                })
                
                if (signInError) {
                  console.error('Sign in failed:', signInError)
                  throw signInError
                }

                if (!signInData.user) {
                  console.error('No user data after sign in')
                  throw new Error('No user data after sign in')
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
                  throw userError
                }

                if (userData) {
                  console.log('Successfully fetched user data:', userData)
                  setUser({
                    ...signInData.user,
                    is_guest: userData.is_guest,
                    guest_created_at: userData.guest_created_at
                  })
                  setLoading(false)
                  return
                }
              } catch (reAuthError) {
                console.error('Re-authentication failed:', reAuthError)
                clearGuestUserInfo() // 無効なゲスト情報をクリア
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
              console.log('Setting user data:', userData)
              // セッションのユーザー情報にデータベースの情報を統合
              setUser({
                ...session.user,
                is_guest: userData.is_guest,
                guest_created_at: userData.guest_created_at
              })
            } else {
              console.log('Setting session user:', session.user)
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
            console.log('Auth state change: setting user data:', userData)
            // セッションのユーザー情報にデータベースの情報を統合
            setUser({
              ...session.user,
              is_guest: userData.is_guest,
              guest_created_at: userData.guest_created_at
            })
          } else {
            console.log('Auth state change: setting session user:', session.user)
            setUser(session.user)
          }
        } else {
          setUser(null)
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

  // ゲストユーザーかどうかを確認
  const isGuestUser = () => {
    if (!user) return false;
    
    // データベースのis_guestフラグを優先的に確認
    if (user.is_guest === true) return true;
    
    // メールアドレスによる判定（バックアップ判定）
    if (user.email && user.email.includes('@guest.healthle.com')) return true;
    
    // ユーザーメタデータによる判定
    const userMetadata = user.user_metadata;
    if (userMetadata && userMetadata.is_guest === true) return true;
    
    return false;
  }

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