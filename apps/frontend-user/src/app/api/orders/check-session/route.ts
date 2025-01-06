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

    // セッションIDに紐づく注文を取得
    console.log('Searching for order with session_id:', session_id);

    // まず、セッションIDのみで検索
    const { data: orderBySession, error: sessionError } = await supabase
      .from('vendor_orders')
      .select('order_id, status, created_at')
      .eq('stripe_session_id', session_id)
      .single();

    console.log('Search result by session_id:', {
      order: orderBySession,
      error: sessionError
    });

    if (!orderBySession) {
      // セッションIDで見つからない場合、最新の注文を確認
      const { data: latestOrder, error: latestError } = await supabase
        .from('vendor_orders')
        .select('order_id, status, created_at, stripe_session_id')
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Latest paid order:', {
        order: latestOrder,
        error: latestError
      });

      if (latestOrder) {
        // 最新の注文が見つかった場合、セッションIDを更新
        const { error: updateError } = await supabase
          .from('vendor_orders')
          .update({ stripe_session_id: session_id })
          .eq('order_id', latestOrder.order_id);

        console.log('Updated session_id for order:', {
          order_id: latestOrder.order_id,
          error: updateError
        });

        return NextResponse.json({
          order_id: latestOrder.order_id
        });
      }
    } else if (orderBySession.status === 'paid') {
      // セッションIDで見つかり、かつpaid状態の場合
      return NextResponse.json({
        order_id: orderBySession.order_id
      });
    }

    console.warn('No suitable order found for session:', session_id);
    return NextResponse.json(
      { error: 'Order not found for this session' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
} 