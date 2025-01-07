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
  const [authError, setAuthError] = useState<Error | null>(null)

  // ユーザー情報を取得する関数
  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
        .throwOnError();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return null;
    }
  };

  // ユーザー情報を設定し、ゲストステータスを更新する関数
  const updateUserAndGuestStatus = async (userData: any, sessionUser: any) => {
    try {
      console.log('Updating user and guest status:', { userData, sessionUser });
      const userWithMetadata = {
        ...sessionUser,
        ...userData,
        is_guest: userData?.is_guest ?? false,
        guest_created_at: userData?.guest_created_at
      };
      setUser(userWithMetadata);
      setIsGuestUser(userData?.is_guest === true);
      setAuthError(null);
      return userWithMetadata;
    } catch (error) {
      console.error('Error updating user and guest status:', error);
      setAuthError(error as Error);
      setUser(sessionUser);
      setIsGuestUser(false);
      return sessionUser;
    }
  };

  // ゲストユーザーの再認証処理
  const reAuthenticateGuestUser = async (guestInfo: { email: string; password: string }) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    const attemptAuth = async (): Promise<any> => {
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: guestInfo.email,
          password: guestInfo.password
        });

        if (signInError) {
          throw signInError;
        }

        if (!signInData.user) {
          throw new Error('No user data returned from authentication');
        }

        return signInData.user;
      } catch (error) {
        console.error(`Authentication attempt ${retryCount + 1} failed:`, error);
        throw error;
      }
    };

    while (retryCount < MAX_RETRIES) {
      try {
        const user = await attemptAuth();
        console.log('Guest user re-authenticated:', user);
        return user;
      } catch (error) {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`Retrying authentication in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('Guest re-authentication failed after all retries');
    clearGuestUserInfo();
    setAuthError(new Error('再認証に失敗しました。もう一度お試しください。'));
    return null;
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
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (!session?.user) {
          console.log('No active session')
          if (mounted) {
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
              console.log('User data not found, signing out:', session.user)
              await logout();  // ユーザーデータが見つからない場合はログアウト
            }
          } catch (error) {
            console.error('Error fetching user data:', error)
            await logout();  // エラーが発生した場合もログアウト
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
          await logout();
          setLoading(false);
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [])

  // ゲストアカウントを正規アカウントに移行
  const migrateGuestToRegular = async (newUserId: string) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    interface UserData {
      id: string;
      is_guest: boolean;
      email: string;
      guest_created_at?: string;
    }

    const migrate = async (): Promise<boolean> => {
      try {
        console.log('Starting guest user migration:', {
          guestUserId: user?.id,
          newUserId: newUserId,
          attempt: retryCount + 1
        });

        if (!user?.id) {
          throw new Error('Guest user ID not found');
        }

        // データベースからゲストユーザー情報を取得
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('is_guest', true)
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          console.error('Failed to find guest user:', userError);
          throw new Error('Guest user not found in database');
        }

        const guestUserId = (userData as UserData).id;

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
            is_guest: false
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
      
      // 既存のセッションを完全にクリア
      await logout();
      
      // 少し待機して確実にセッションがクリアされるのを待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
        setAuthError(new Error('ゲストユーザーの作成に失敗しました。もう一度お試しください。'));
        throw signUpError;
      }

      if (!signUpData.user) {
        const error = new Error('ゲストユーザーの作成に失敗しました。もう一度お試しください。');
        setAuthError(error);
        throw error;
      }

      console.log('Guest user created:', signUpData.user);

      // トランザクションでユーザー情報を保存
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
        // Rollback: 認証ユーザーを削除
        await supabase.auth.admin.deleteUser(signUpData.user.id);
        setAuthError(new Error('ゲストユーザーの作成に失敗しました。もう一度お試しください。'));
        throw userError;
      }

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
        setAuthError(new Error('ゲストユーザーのログインに失敗しました。もう一度お試しください。'));
        throw signInError || new Error('Failed to sign in guest user');
      }

      console.log('Guest user signed in:', signInData.user);
      
      // ユーザー情報を設定
      const userWithMetadata = {
        ...signInData.user,
        is_guest: true,
        guest_created_at: new Date().toISOString()
      };
      
      setAuthError(null);
      setUser(userWithMetadata);
      setIsGuestUser(true);
      setLoading(false);
      return userWithMetadata;

    } catch (error) {
      console.error('Guest login error:', error);
      setAuthError(error as Error);
      setLoading(false);
      throw error;
    }
  }

  return {
    user,
    loading,
    authError,
    setUser,
    login,
    logout,
    isGuestUser,
    migrateGuestToRegular,
    loginAsGuest
  }
} 