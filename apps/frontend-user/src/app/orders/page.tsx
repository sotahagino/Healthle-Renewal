'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    description: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  items: OrderItem[];
  shipping_address?: {
    postal_code: string;
    prefecture: string;
    city: string;
    address_line: string;
  };
}

const statusLabels: { [key: string]: string } = {
  pending: '処理中',
  confirmed: '確認済み',
  paid: '支払い完了',
  shipped: '発送済み',
  delivered: '配達完了',
  cancelled: 'キャンセル',
  refunded: '返金済み',
  failed: '失敗',
};

const statusColors: { [key: string]: string } = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user?.id) {
          setError('ログインが必要です');
          return;
        }

        const { data: ordersData, error: ordersError } = await supabase
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
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        const formattedOrders: Order[] = ordersData.map(order => ({
          id: order.id,
          status: order.status,
          amount: order.amount,
          created_at: order.created_at,
          items: order.order_items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product: item.products,
          })),
        }));

        setOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('注文履歴の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/" passHref>
                <Button>トップページに戻る</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">注文履歴</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">注文履歴がありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm text-gray-600">
                          注文番号：{order.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          注文日時：{new Date(order.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
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

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">合計金額</span>
                      <span className="text-lg font-bold">
                        ¥{order.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 