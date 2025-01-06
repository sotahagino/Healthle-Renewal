import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // セッションの確認
    const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    // ユーザーが未ログインの場合はエラーを返さない
    let userId = authSession?.user?.id;
    let userData = null;

    if (userId) {
      // ログイン済みユーザーの情報を取得
      const { data: userDataResult, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      userData = userDataResult;
    }

    // リクエストボディの解析
    const body = await req.json();
    const { items, consultation_id, guestInfo } = body;

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

    // 注文の作成
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          status: 'pending',
          amount: items.reduce((total, item) => {
            const product = products.find(p => p.id === item.product_id);
            return total + (product?.price || 0) * item.quantity;
          }, 0),
          consultation_id: consultation_id || null,
          is_guest_order: !userId
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // 注文アイテムの作成
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: products.find(p => p.id === item.product_id)?.price || 0
    }));

    const { error: orderItemError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemError) throw orderItemError;

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
        order_id: order.id,
        consultation_id: consultation_id || null,
        is_guest_order: !userId ? 'true' : 'false'
      },
    });

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      orderId: order.id
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'チェックアウトに失敗しました' },
      { status: 500 }
    );
  }
} 