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

    // 現在のユーザーIDを取得
    const currentUserId = authSession?.user?.id;
    if (!currentUserId) {
      console.error('No user ID found in session');
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
    });

    // vendor_ordersにも事前に注文情報を作成
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating vendor order:', {
        session_id: checkoutSession.id,
        product_id: product.id,
        user_id: currentUserId,
        data: vendorOrderData
      });

      // vendor_ordersテーブルにデータを挿入
      const { data: insertedOrder, error: vendorOrderError } = await supabase
        .from('vendor_orders')
        .insert([vendorOrderData])
        .select()
        .single();

      if (vendorOrderError) {
        console.error('Failed to create vendor order:', {
          error: vendorOrderError,
          session_id: checkoutSession.id,
          product_id: product.id,
          user_id: currentUserId,
          data: vendorOrderData
        });
        throw vendorOrderError;
      }

      console.log('Successfully created vendor order:', insertedOrder);
    }

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'チェックアウトの作成に失敗しました' },
      { status: 500 }
    );
  }
} 