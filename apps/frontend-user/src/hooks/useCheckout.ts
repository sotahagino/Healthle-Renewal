import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface CheckoutItem {
  product_id: string;
  price: number;
  quantity: number;
}

export interface UseCheckoutReturn {
  isLoading: boolean;
  error: Error | null;
  createCheckoutSession: (items: CheckoutItem[]) => Promise<string | null>;
}

export function useCheckout(): UseCheckoutReturn {
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createCheckoutSession = async (items: CheckoutItem[]): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // セッションの確認
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user?.id) throw new Error('認証されていません');

      // ユーザー情報の確認
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('ユーザー情報が見つかりません');

      // 必要な配送情報の確認
      const hasRequiredInfo = userData.name && 
        userData.phone_number && 
        userData.postal_code &&
        userData.prefecture &&
        userData.city;

      if (!hasRequiredInfo) {
        throw new Error('配送情報が不足しています');
      }

      // チェックアウトセッションの作成
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '決済セッションの作成に失敗しました');
      }

      const { sessionUrl, error: checkoutError } = await response.json();
      if (checkoutError) throw new Error(checkoutError);

      return sessionUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error : new Error('決済処理中にエラーが発生しました'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createCheckoutSession,
  };
} 