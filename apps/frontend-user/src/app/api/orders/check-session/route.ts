import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json();
    console.log('Checking session with ID:', session_id);

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Stripeセッションを取得
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Retrieved session:', {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata
    });
    
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed:', session.payment_status);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // 最新の注文を取得
    const { data: latestOrder, error: orderError } = await supabase
      .from('vendor_orders')
      .select('order_id')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Latest order query result:', {
      order: latestOrder,
      error: orderError
    });

    if (orderError || !latestOrder) {
      console.warn('No paid orders found');
      return NextResponse.json(
        { error: 'No paid orders found' },
        { status: 404 }
      );
    }

    console.log('Found latest order:', latestOrder);

    return NextResponse.json({
      order_id: latestOrder.order_id
    });

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
} 