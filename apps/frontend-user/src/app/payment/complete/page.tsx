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

  const updateOrderUserId = async (userId: string) => {
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

    try {
      setIsRegistering(true);
      setRegistrationError(null);

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
        // 注文情報のuser_idを更新
        await updateOrderUserId(data.user.id);
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="パスワードを設定してください"
                />
              </div>
              {registrationError && (
                <p className="text-red-600 text-sm">{registrationError}</p>
              )}
              <button
                onClick={handleRegistration}
                disabled={isRegistering}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isRegistering ? '登録中...' : 'アカウントを登録する'}
              </button>
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