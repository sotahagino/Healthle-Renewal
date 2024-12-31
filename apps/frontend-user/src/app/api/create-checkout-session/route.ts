import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { order_id, total_amount } = await request.json();

    // ordersテーブルから status='pending' を確認
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('status', 'pending')
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Invalid order' },
        { status: 400 }
      );
    }

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: `Order #${order_id}`,
          },
          unit_amount: total_amount,
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        order_id: order_id,
      }
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
} 