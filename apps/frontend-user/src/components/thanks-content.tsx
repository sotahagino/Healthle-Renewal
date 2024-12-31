'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  items: {
    product_id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      description: string;
      image_url: string;
    };
  }[];
}

export function ThanksContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          setError('セッションIDが見つかりません');
          return;
        }

        // セッションの確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user?.id) {
          setError('ログインが必要です');
          return;
        }

        // 注文情報の取得
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            amount,
            created_at,
            order_items (
              product_id,
              quantity,
              price,
              products (
                name,
                description,
                image_url
              )
            )
          `)
          .eq('stripe_session_id', sessionId)
          .eq('user_id', session.user.id)
          .single();

        if (orderError) throw orderError;
        if (!orderData) {
          setError('注文情報が見つかりません');
          return;
        }

        // 注文情報の整形
        const formattedOrder: OrderDetails = {
          id: orderData.id,
          status: orderData.status,
          amount: orderData.amount,
          created_at: orderData.created_at,
          items: orderData.order_items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product: item.products,
          })),
        };

        setOrder(formattedOrder);
      } catch (error) {
        console.error('Error checking session:', error);
        setError('注文情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [searchParams, supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" passHref>
            <Button>トップページに戻る</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          ご注文ありがとうございます
        </h1>
        
        {order && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <p className="text-sm text-gray-600">注文番号：{order.id}</p>
              <p className="text-sm text-gray-600">
                注文日時：{new Date(order.created_at).toLocaleString('ja-JP')}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">注文内容</h2>
              {order.items.map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  {item.product.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">
                      数量: {item.quantity}
                    </p>
                    <p className="text-sm font-medium">
                      ¥{item.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">合計金額</span>
                <span className="text-lg font-bold">
                  ¥{order.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                ご注文の確認メールをお送りしました。
              </p>
              <p className="text-sm text-gray-600">
                商品の発送準備が整い次第、発送のお知らせメールをお送りいたします。
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <Link href="/orders" passHref>
                <Button variant="outline">注文履歴を見る</Button>
              </Link>
              <Link href="/" passHref>
                <Button>トップページに戻る</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 