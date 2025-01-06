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

    // webhook_logsテーブルから注文情報を取得
    const { data: webhookLog, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('processed_data')
      .eq('event_type', 'checkout.session.completed')
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Webhook log query result:', {
      log: webhookLog,
      error: webhookError
    });

    if (webhookError || !webhookLog || !webhookLog.processed_data) {
      console.warn('No webhook log found');
      return NextResponse.json(
        { error: 'Order information not found' },
        { status: 404 }
      );
    }

    const orderInfo = webhookLog.processed_data as {
      order_id: string;
      timestamp: number;
    };

    console.log('Found order info from webhook log:', orderInfo);

    if (!orderInfo.order_id) {
      console.warn('No order_id in webhook log');
      return NextResponse.json(
        { error: 'Order ID not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order_id: orderInfo.order_id,
      timestamp: orderInfo.timestamp
    });

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
} 