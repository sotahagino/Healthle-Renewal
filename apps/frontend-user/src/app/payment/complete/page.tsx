'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/header';

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
      
      // マイページに遷移
      router.push('/mypage');

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
      <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Icons.spinner className="h-8 w-8 animate-spin text-[#4C9A84]" />
          <span className="ml-2 text-gray-600">決済情報を確認中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-center text-red-600">
                <Icons.chevronRight className="h-6 w-6 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {!isLoggedIn && orderInfo?.customer_email && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#4C9A84]">
                アカウント登録のご案内
              </CardTitle>
              <CardDescription>
                アカウントを登録すると、注文履歴の確認や次回のお買い物がより便利になります。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <Input
                    type="email"
                    value={orderInfo.customer_email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <Icons.eyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Icons.eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード（確認）
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <Icons.eyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Icons.eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {registrationError && (
                  <div className="text-red-600 text-sm flex items-center">
                    <Icons.chevronRight className="h-4 w-4 mr-1" />
                    {registrationError}
                  </div>
                )}
                <Button
                  onClick={handleRegistration}
                  disabled={isRegistering}
                  className="w-full bg-[#4C9A84] hover:bg-[#3D7A69] text-white"
                >
                  {isRegistering ? (
                    <>
                      <Icons.spinner className="h-4 w-4 mr-2 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      <Icons.userPlus className="h-4 w-4 mr-2" />
                      アカウントを登録
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-[#E8F5F1] p-4">
                <Icons.checkCircle className="h-12 w-12 text-[#4C9A84]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#4C9A84]">
              ご注文ありがとうございます
            </CardTitle>
            {orderInfo && (
              <CardDescription className="text-gray-600">
                注文番号: {orderInfo.order_id}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                ご注文内容の確認メールを送信いたしました。
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => router.push('/mypage')}
                  className="bg-[#4C9A84] hover:bg-[#3D7A69] text-white"
                >
                  <Icons.user className="h-4 w-4 mr-2" />
                  マイページへ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 