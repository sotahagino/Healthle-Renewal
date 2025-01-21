import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: '商品が選択されていません' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const productId = items[0].product_id;
    const supabase = createRouteHandlerClient({ cookies });

    // 商品情報の取得
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return new NextResponse(
        JSON.stringify({ error: '商品情報の取得に失敗しました' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // PaymentIntentの作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: 'jpy',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        product_id: productId,
      }
    });

    return new NextResponse(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Checkout error:', error);
    return new NextResponse(
      JSON.stringify({ error: '決済処理の初期化に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 