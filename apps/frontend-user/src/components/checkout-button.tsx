'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type CheckoutButtonProps = {
  productId: string;
  price: number;
};

export function CheckoutButton({ productId, price }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

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

      const { sessionUrl, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Stripeのチェックアウトページにリダイレクト
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('決済処理に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '処理中...' : '決済に進む'}
    </Button>
  );
} 