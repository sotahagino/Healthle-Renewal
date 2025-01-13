'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface OrderInfo {
  order_id: string;
  customer_email: string | null;
}

export default function CompletePage() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const interviewId = searchParams.get('interview_id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkPaymentAndAuth = async () => {
      try {
        setIsLoading(true);
        
        // セッションチェック
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        // 支払い状態の確認
        const response = await fetch(`/api/checkout/check-session?payment_intent=${paymentIntentId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '決済情報の確認に失敗しました');
        }

        if (data.status === 'success') {
          setOrderInfo({
            order_id: data.order_id,
            customer_email: data.customer_email
          });
        }
      } catch (err) {
        console.error('Payment check error:', err);
        setError(err instanceof Error ? err.message : '決済情報の確認に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (paymentIntentId) {
      checkPaymentAndAuth();
    }
  }, [paymentIntentId, supabase]);

  const updateOrderUserId = async (userId: string, shippingInfo: any) => {
    try {
      // 注文情報を更新
      const { error: orderError } = await supabase
        .from('vendor_orders')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('stripe_session_id', paymentIntentId);

      if (orderError) {
        console.error('Error updating order:', orderError);
        throw orderError;
      }

      // user_profilesテーブルに情報を保存
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: shippingInfo.email,
          name: shippingInfo.name,
          phone: shippingInfo.phone,
          postal_code: shippingInfo.postal_code,
          prefecture: shippingInfo.prefecture,
          city: shippingInfo.city,
          address_line1: shippingInfo.address_line1,
          address_line2: shippingInfo.address_line2 || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        throw profileError;
      }

      // medical_interviewsテーブルの更新
      if (interviewId) {
        const { error: interviewError } = await supabase
          .from('medical_interviews')
          .update({ 
            user_id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', interviewId);

        if (interviewError) {
          console.error('Error updating medical interview:', interviewError);
          throw interviewError;
        }
      }
    } catch (error) {
      console.error('Error in updateOrderUserId:', error);
      throw error;
    }
  };

  const handleRegistration = async () => {
    if (!orderInfo?.customer_email || !password) {
      setRegistrationError('メールアドレスとパスワードを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      setRegistrationError('パスワードが一致しません');
      return;
    }

    try {
      setIsRegistering(true);
      setRegistrationError(null);

      // 注文情報から配送先情報を取得
      const { data: orderData, error: orderError } = await supabase
        .from('vendor_orders')
        .select('shipping_info, shipping_name, shipping_phone, shipping_address')
        .eq('stripe_session_id', paymentIntentId)
        .single();

      if (orderError) {
        throw orderError;
      }

      // 住所を分解
      const addressParts = orderData.shipping_address?.match(/〒(\d{3}-?\d{4})\s+([^市]*[都道府県])?([^市]*市)?(.+)/) || [];
      const shippingInfo = {
        email: orderInfo.customer_email,
        name: orderData.shipping_name,
        phone: orderData.shipping_phone,
        postal_code: addressParts[1]?.replace('-', '') || '',
        prefecture: addressParts[2] || '',
        city: addressParts[3] || '',
        address_line1: addressParts[4] || '',
        address_line2: null
      };

      // アカウント登録
      const { data, error } = await supabase.auth.signUp({
        email: orderInfo.customer_email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // 注文情報とプロフィール情報を更新
        await updateOrderUserId(data.user.id, shippingInfo);
      }

      // 登録成功
      router.refresh();
      setIsLoggedIn(true);

      // 成功メッセージを表示
      alert('アカウント登録が完了しました。確認メールをご確認ください。');

    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationError(
        err instanceof Error ? 
          err.message : 
          'アカウント登録に失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">決済情報を確認中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ご注文ありがとうございます
          </h1>
          {orderInfo && (
            <p className="text-gray-600 mb-8">
              注文番号: {orderInfo.order_id}
            </p>
          )}
        </div>

        {!isLoggedIn && orderInfo?.customer_email && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              アカウント登録のご案内
            </h2>
            <p className="text-gray-600 mb-4">
              アカウントを登録すると、注文履歴の確認や次回のお買い物がより便利になります。
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={orderInfo.customer_email || ''}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを設定"
                  className="w-full p-2 border rounded pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="パスワードを確認"
                  className="w-full p-2 border rounded pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              <button
                onClick={handleRegistration}
                disabled={isRegistering}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isRegistering ? '登録中...' : 'アカウントを登録'}
              </button>
              {registrationError && (
                <p className="text-red-500 text-sm">{registrationError}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            トップページに戻る
          </a>
        </div>
      </div>
    </div>
  );
} 