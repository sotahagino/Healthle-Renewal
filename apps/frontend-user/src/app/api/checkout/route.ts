import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // セッションの確認
    const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!authSession?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // ユーザー情報の取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authSession.user.id)
      .single();

    if (userError) throw userError;
    if (!userData) {
      return NextResponse.json(
        { error: 'ユーザー情報が見つかりません' },
        { status: 404 }
      );
    }

    // 必要な配送情報の確認
    const hasRequiredInfo = userData.name &&
      userData.phone_number &&
      userData.postal_code &&
      userData.prefecture &&
      userData.city;

    if (!hasRequiredInfo) {
      return NextResponse.json(
        { error: '配送情報が不足しています' },
        { status: 400 }
      );
    }

    // リクエストボディの解析
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '商品情報が不正です' },
        { status: 400 }
      );
    }

    // 商品情報の取得と検証
    const productIds = items.map(item => item.product_id);
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('status', 'on_sale');

    if (productError) throw productError;
    if (!products || products.length !== items.length) {
      return NextResponse.json(
        { error: '商品が見つかりません' },
        { status: 404 }
      );
    }

    // 注文の作成
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: authSession.user.id,
        status: 'pending',
        amount: items.reduce((total, item) => {
          const product = products.find(p => p.id === item.product_id);
          return total + (product ? product.price * item.quantity : 0);
        }, 0),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 注文商品の登録
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: products.find(p => p.id === item.product_id)?.price || 0,
    }));

    const { error: orderItemError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemError) throw orderItemError;

    // Stripeの顧客IDの取得または作成
    let stripeCustomerId = userData.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email || undefined,
        name: userData.name,
        phone: userData.phone_number,
        metadata: {
          user_id: userData.id,
        },
      });
      stripeCustomerId = customer.id;

      // Stripe顧客IDの保存
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userData.id);

      if (updateError) throw updateError;
    }

    // Stripeチェックアウトセッションの作成
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: authSession.user.id,
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
      metadata: {
        order_id: order.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'チェックアウトの処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 