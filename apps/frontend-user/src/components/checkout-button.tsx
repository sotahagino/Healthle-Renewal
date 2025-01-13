'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type CheckoutButtonProps = {
  productId: string;
  price: number;
};

export function CheckoutButton({ productId, price }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (isLoading) return; // 既に処理中の場合は何もしない

    try {
      setIsLoading(true);
      setError(null);

      // チェックアウトセッションの作成
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            product_id: productId,
            price: price,
            quantity: 1,
          }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済処理に失敗しました');
      }

      if (data.url) {
        // Stripeのチェックアウトページにリダイレクト
        window.location.href = data.url;
      } else {
        throw new Error('決済URLの取得に失敗しました');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : '決済処理に失敗しました');
      setIsLoading(false); // エラー時のみローディング状態を解除
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            <span>処理中...</span>
          </div>
        ) : (
          '決済に進む'
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
} 