import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error('Stripe secret key is not set in environment variables');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: '決済IDが指定されていません' },
        { status: 400 }
      );
    }

    console.log('Retrieving PaymentIntent:', paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('PaymentIntent status:', paymentIntent.status);

    if (paymentIntent.status === 'succeeded') {
      // 注文状態を更新
      const { error: updateError } = await supabase
        .from('vendor_orders')
        .update({
          status: 'PAID',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error('Order update error:', updateError);
        return NextResponse.json(
          { error: '注文状態の更新に失敗しました' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (err) {
    console.error('Payment status check error:', err);
    return NextResponse.json(
      { error: '決済状態の確認中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 