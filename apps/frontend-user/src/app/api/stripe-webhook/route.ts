import { NextResponse } from 'next/server';
import { headers } from 'next/dist/client/components/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // セッションIDから注文情報を取得
        const { data: order, error: orderError } = await supabaseAdmin
          .from('vendor_orders')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          throw orderError;
        }

        if (!order) {
          throw new Error(`Order not found for session: ${session.id}`);
        }

        // 注文ステータスを更新
        const { error: updateError } = await supabaseAdmin
          .from('vendor_orders')
          .update({
            status: 'paid',
            payment_status: 'completed',
            stripe_payment_intent_id: session.payment_intent as string,
            shipping_name: session.shipping_details?.name,
            shipping_address: session.shipping_details?.address ? 
              `〒${session.shipping_details.address.postal_code} ${session.shipping_details.address.state}${session.shipping_details.address.city}${session.shipping_details.address.line1}${session.shipping_details.address.line2 ? ' ' + session.shipping_details.address.line2 : ''}` : null,
            shipping_phone: session.shipping_details?.phone,
            customer_email: session.customer_details?.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Error updating order:', updateError);
          throw updateError;
        }

        // 在庫の更新処理（必要に応じて実装）
        // メール通知の送信（必要に応じて実装）
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // PaymentIntentIDから注文情報を取得
        const { data: order, error: orderError } = await supabaseAdmin
          .from('vendor_orders')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          throw orderError;
        }

        if (order) {
          const { error: updateError } = await supabaseAdmin
            .from('vendor_orders')
            .update({
              status: 'failed',
              payment_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          if (updateError) {
            console.error('Error updating order:', updateError);
            throw updateError;
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler failed:', err.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 