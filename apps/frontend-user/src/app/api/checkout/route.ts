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
    const orderData = {
      user_id: userId,
      status: 'pending',
      amount: items.reduce((total, item) => {
        const product = products.find(p => p.id === item.product_id);
        return total + (product?.price || 0) * item.quantity;
      }, 0),
      consultation_id: consultation_id || null,
      is_guest_order: !userId
    };

    // vendor_ordersにも事前に注文情報を作成
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) continue;

      const vendorOrderData = {
        user_id: userId,
        vendor_id: product.vendor_id,
        product_id: product.id,
        status: 'pending',
        total_amount: product.price,
        commission_rate: product.commission_rate || 10,
        consultation_id: consultation_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: vendorOrderError } = await supabase
        .from('vendor_orders')
        .insert([vendorOrderData]);

      if (vendorOrderError) throw vendorOrderError;
    }

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
        user_id: userId || '',
        consultation_id: consultation_id || '',
        is_guest_order: !userId ? 'true' : 'false'
      },
      client_reference_id: userId || undefined,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'チェックアウトの作成に失敗しました' },
      { status: 500 }
    );
  }
} 