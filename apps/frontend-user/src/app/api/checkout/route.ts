import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

interface OrderItem {
  product_id: string;
  quantity: number;
}

async function createVendorOrder(supabase: any, orderData: any) {
  const { data, error } = await supabase
    .from('vendor_orders')
    .insert([orderData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function rollbackVendorOrders(supabase: any, sessionId: string) {
  const { error } = await supabase
    .from('vendor_orders')
    .delete()
    .eq('stripe_session_id', sessionId);

  if (error) {
    console.error('Rollback failed:', error);
  }
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // セッションの確認
    const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    // 現在のユーザーIDを取得
    const currentUserId = authSession?.user?.id;
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'ユーザー情報が見つかりません' },
        { status: 401 }
      );
    }

    console.log('Current user session:', {
      user_id: currentUserId,
      email: authSession?.user?.email
    });

    // リクエストボディの解析
    const body = await req.json();
    const { items, consultation_id } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '商品情報が不正です' },
        { status: 400 }
      );
    }

    // 商品情報の取得
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*')
      .in('id', items.map(item => item.product_id));

    if (productError) throw productError;

    // トランザクション開始
    const { error: txError } = await supabase.rpc('begin_transaction');
    if (txError) throw txError;

    try {
      // Stripeセッションの作成
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: product?.name || 'Unknown Product',
                description: product?.description,
              },
              unit_amount: product?.price || 0,
            },
            quantity: item.quantity,
          };
        }),
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/purchase-complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
        metadata: {
          user_id: currentUserId,
          consultation_id: consultation_id || '',
        },
        client_reference_id: currentUserId,
        customer_email: authSession?.user?.email,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1時間でセッション期限切れ
        shipping_address_collection: {
          allowed_countries: ['JP'],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 0,
                currency: 'jpy',
              },
              display_name: '通常配送',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 3,
                },
                maximum: {
                  unit: 'business_day',
                  value: 7,
                },
              },
            },
          },
        ],
      });

      console.log('Created checkout session:', {
        session_id: checkoutSession.id,
        user_id: currentUserId,
        metadata: checkoutSession.metadata,
        client_reference_id: checkoutSession.client_reference_id
      });

      // vendor_ordersにも事前に注文情報を作成
      const vendorOrders = [];
      for (const item of items) {
        const product = products.find(p => p.id === item.product_id);
        if (!product) continue;

        const vendorOrderData = {
          user_id: currentUserId,
          vendor_id: product.vendor_id,
          product_id: product.id,
          status: 'pending',
          total_amount: product.price * item.quantity,
          commission_rate: product.commission_rate || 10,
          consultation_id: consultation_id || null,
          stripe_session_id: checkoutSession.id,
          customer_email: authSession?.user?.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const vendorOrder = await createVendorOrder(supabase, vendorOrderData);
          vendorOrders.push(vendorOrder);
        } catch (error) {
          console.error('Error creating vendor order:', error);
          // ロールバック処理
          await rollbackVendorOrders(supabase, checkoutSession.id);
          throw error;
        }
      }

      // トランザクションのコミット
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;

      return NextResponse.json({
        sessionId: checkoutSession.id,
        sessionUrl: checkoutSession.url,
        vendorOrders
      });

    } catch (error) {
      // エラー発生時のロールバック
      const { error: rollbackError } = await supabase.rpc('rollback_transaction');
      if (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || '決済処理中にエラーが発生しました' },
      { status: error.status || 500 }
    );
  }
} 