import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { getGuestUserInfo, clearGuestUserInfo, saveGuestUserInfo } from '@/utils/guest-utils'
import { generateGuestEmail, generateGuestPassword } from '@/utils/guest-utils'

export function useAuth() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isGuestUser, setIsGuestUser] = useState(false)

  // ユーザー情報を設定し、ゲストステータスを更新する関数
  const updateUserAndGuestStatus = async (userData: any, sessionUser: any) => {
    try {
      console.log('Updating user and guest status:', { userData, sessionUser });
      const userWithMetadata = {
        ...sessionUser,
        is_guest: userData.is_guest,
        guest_created_at: userData.guest_created_at
      };
      setUser(userWithMetadata);
      setIsGuestUser(userData.is_guest === true);
      return userWithMetadata;
    } catch (error) {
      console.error('Error updating user and guest status:', error);
      setUser(null);
      setIsGuestUser(false);
      throw error;
    }
  };

  // ゲストユーザーの再ログイン処理
  const reAuthenticateGuestUser = async (guestInfo: { email: string; password: string }) => {
    try {
      console.log('Attempting to re-authenticate guest user');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: guestInfo.email,
        password: guestInfo.password
      });

      if (signInError || !signInData.user) {
        console.error('Guest re-authentication failed:', signInError);
        clearGuestUserInfo();
        return null;
      }

      console.log('Guest user re-authenticated:', signInData.user);
      return signInData.user;
    } catch (error) {
      console.error('Error in guest re-authentication:', error);
      clearGuestUserInfo();
      return null;
    }
  };

  useEffect(() => {
    let mounted = true
    let authInitialized = false

    async function initializeAuth() {
      if (authInitialized) return;
      authInitialized = true;

      try {
        console.log('Initializing auth...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          // セッションエラー時にゲストユーザー情報を確認
          const guestInfo = getGuestUserInfo()
          if (guestInfo && typeof guestInfo.email === 'string' && typeof guestInfo.password === 'string') {
            console.log('Found guest info, attempting re-authentication');
            const reAuthUser = await reAuthenticateGuestUser(guestInfo);
            if (reAuthUser && mounted) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', reAuthUser.id)
                .single();

              if (userData) {
                await updateUserAndGuestStatus(userData, reAuthUser);
              }
            }
          }
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (!session?.user) {
          console.log('No active session, checking local storage')
          if (mounted) {
            const guestInfo = getGuestUserInfo()
            if (guestInfo && typeof guestInfo.email === 'string' && typeof guestInfo.password === 'string') {
              const reAuthUser = await reAuthenticateGuestUser(guestInfo);
              if (reAuthUser) {
                const { data: userData } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', reAuthUser.id)
                  .single();

                if (userData && mounted) {
                  await updateUserAndGuestStatus(userData, reAuthUser);
                }
              }
            }
            setLoading(false);
          }
          return;
        }

        // アクティブなセッションがある場合
        if (mounted) {
          try {
            console.log('Fetching user data for active session:', session.user.id);
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (!userError && userData) {
              console.log('User data fetched successfully:', userData);
              await updateUserAndGuestStatus(userData, session.user)
            } else {
              console.log('Setting session user without database info:', session.user)
              setUser(session.user)
              setIsGuestUser(false)
            }
          } catch (error) {
            console.error('Error fetching user data:', error)
            if (mounted) {
              setUser(session?.user || null)
              setIsGuestUser(false)
            }
          } finally {
            if (mounted) {
              console.log('Auth initialization completed');
              setLoading(false)
            }
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
        if (mounted) {
          // エラー時もゲストユーザーの再認証を試みる
          const guestInfo = getGuestUserInfo()
          if (guestInfo && typeof guestInfo.email === 'string' && typeof guestInfo.password === 'string') {
            const reAuthUser = await reAuthenticateGuestUser(guestInfo);
            if (reAuthUser && mounted) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', reAuthUser.id)
                .single();

              if (userData) {
                await updateUserAndGuestStatus(userData, reAuthUser);
              }
            }
          }
          setLoading(false);
        }
      }
    }

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session })
      
      if (!mounted) return

      try {
        if (!session?.user) {
          console.log('No user in session after state change')
          setUser(null)
          setIsGuestUser(false)
          setLoading(false)
          return
        }

        console.log('Fetching user data after auth state change:', session.user.id);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!userError && userData) {
          console.log('User data fetched after auth state change:', userData);
          await updateUserAndGuestStatus(userData, session.user)
        } else {
          console.log('Setting session user without database info:', session.user)
          setUser(session.user)
          setIsGuestUser(false)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUser(session?.user || null)
        setIsGuestUser(false)
      } finally {
        if (mounted) {
          console.log('Auth state change completed');
          setLoading(false)
        }
      }
    })

    // 初期化を実行
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

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
      console.log('Starting logout process...');
      
      // Supabaseからログアウト
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      
      // ゲストユーザー情報をクリア
      clearGuestUserInfo();
      
      // ローカルストレージをクリア
      window.localStorage.clear();
      
      // セッションストレージをクリア
      window.sessionStorage.clear();

      // すべてのクッキーを削除
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        const cookieName = name.trim();
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
      });

      // 状態をリセット
      setUser(null);
      setIsGuestUser(false);
      setLoading(false);

      console.log('Logout completed successfully');
      
      // ログインページにリダイレクト
      router.push('/login');
      
    } catch (error) {
      console.error('Logout process failed:', error);
      throw error;
    }
  };

  // ゲストユーザーとしてログイン
  const loginAsGuest = async () => {
    try {
      console.log('Starting guest login process...');
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

      if (signUpError) {
        console.error('Failed to sign up guest user:', signUpError);
        throw signUpError;
      }
      if (!signUpData.user) {
        console.error('No user data after sign up');
        throw new Error('ユーザー作成に失敗しました');
      }

      console.log('Guest user created:', signUpData.user);

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
        console.error('Failed to create guest user in database:', userError);
        // usersテーブルへの挿入に失敗した場合、認証ユーザーを削除
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        throw userError;
      }

      console.log('Guest user info saved to database');

      // ゲストユーザー情報をローカルストレージに保存
      saveGuestUserInfo(signUpData.user.id, email, password);
      console.log('Guest user info saved to local storage');
      
      // 自動的にログインを実行
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.user) {
        console.error('Failed to sign in guest user:', signInError);
        throw signInError || new Error('Failed to sign in guest user');
      }

      console.log('Guest user signed in:', signInData.user);
      
      // ユーザー情報を設定
      const userWithMetadata = {
        ...signInData.user,
        is_guest: true,
        guest_created_at: new Date().toISOString()
      };
      
      console.log('Setting user with metadata:', userWithMetadata);
      setUser(userWithMetadata);
      return userWithMetadata;

    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
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