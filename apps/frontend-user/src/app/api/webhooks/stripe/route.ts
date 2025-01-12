import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 注文ステータスの定義
const ORDER_STATUS = {
  PENDING: 'pending',           // 支払い待ち
  PAID: 'paid',                // 支払い完了
  PREPARING: 'preparing',      // 発送準備中
  SHIPPED: 'shipped',          // 発送済み
  DELIVERED: 'delivered',      // 配達完了
  CANCELLED: 'cancelled'       // キャンセル
} as const;

// ユーザー情報を更新する関数
async function updateUserShippingInfo(
  userId: string,
  shippingDetails: Stripe.Checkout.Session.ShippingDetails | null
) {
  if (!shippingDetails) return;

  try {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: shippingDetails.name || undefined,
        postal_code: shippingDetails.address?.postal_code || undefined,
        prefecture: shippingDetails.address?.state || undefined,
        city: shippingDetails.address?.city || undefined,
        address: `${shippingDetails.address?.line1 || ''}${shippingDetails.address?.line2 ? ' ' + shippingDetails.address.line2 : ''}` || undefined,
        phone: shippingDetails.phone || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user shipping info:', updateError);
      throw updateError;
    }

    console.log('User shipping info updated successfully');
  } catch (error) {
    console.error('Error updating user shipping info:', error);
    throw error;
  }
}

// 注文情報を更新する関数
async function updateOrderInfo(
  session: Stripe.Checkout.Session,
  product: any
) {
  try {
    // 配送情報の取得
    const shippingInfo = {
      name: session.shipping_details?.name || '',
      postal_code: session.shipping_details?.address?.postal_code || '',
      prefecture: session.shipping_details?.address?.state || '',
      city: session.shipping_details?.address?.city || '',
      address: `${session.shipping_details?.address?.line1 || ''}${session.shipping_details?.address?.line2 ? ' ' + session.shipping_details.address.line2 : ''}`,
      phone: session.shipping_details?.phone || '',
    };

    console.log('Updating order with shipping info:', shippingInfo);

    const orderData = {
      status: ORDER_STATUS.PAID,
      customer_email: session.customer_details?.email || '',
      shipping_name: shippingInfo.name,
      shipping_address: `〒${shippingInfo.postal_code} ${shippingInfo.prefecture}${shippingInfo.city}${shippingInfo.address}`,
      shipping_phone: shippingInfo.phone,
      total_amount: session.amount_total || 0,
      updated_at: new Date().toISOString()
    };

    // 注文情報を更新
    const { error: updateError } = await supabase
      .from('vendor_orders')
      .update(orderData)
      .eq('stripe_session_id', session.id);

    if (updateError) {
      throw new Error(`注文情報の更新に失敗しました: ${updateError.message}`);
    }

    // 更新された注文情報を取得して確認
    const { data: updatedOrder, error: refetchError } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single();

    if (refetchError) {
      throw new Error(`更新後の注文情報の取得に失敗しました: ${refetchError.message}`);
    }

    console.log('Order updated successfully:', updatedOrder);
    return updatedOrder;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
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

    console.log('Received Stripe event:', {
      id: event.id,
      type: event.type,
      api_version: event.api_version
    });

    // Webhookの重複処理を防ぐ
    const { data: existingLog } = await supabase
      .from('webhook_logs')
      .select('id, status')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingLog) {
      console.log('Duplicate event received:', {
        event_id: event.id,
        previous_status: existingLog.status
      });
      return NextResponse.json({ message: 'Duplicate event' }, { status: 200 });
    }

    // Webhookログを作成
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert([
        {
          stripe_event_id: event.id,
          event_type: event.type,
          status: 'processing',
          processed_at: new Date().toISOString(),
          processed_data: null,
          error_message: null
        }
      ])
      .select()
      .single();

    if (logError) {
      console.error('Webhook log creation error:', {
        error: logError,
        details: logError.details,
        message: logError.message
      });
    }

    const webhookLogId = logData?.id;

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Processing checkout.session.completed:', {
          session_id: session.id,
          metadata: session.metadata,
          customer_details: session.customer_details,
          shipping_details: session.shipping_details
        });

        // 商品情報を取得
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', session.metadata?.product_id)
          .single();

        if (productError) {
          throw new Error(`商品情報の取得に失敗しました: ${productError.message}`);
        }

        // 注文情報を更新
        const updatedOrder = await updateOrderInfo(session, product);

        // ユーザー情報も更新
        if (session.client_reference_id) {
          await updateUserShippingInfo(session.client_reference_id, session.shipping_details);
        }

        // 処理成功をログに記録
        if (webhookLogId) {
          await supabase
            .from('webhook_logs')
            .update({
              status: 'success',
              processed_data: {
                order: updatedOrder,
                product: product
              },
              processed_at: new Date().toISOString()
            })
            .eq('id', webhookLogId);
        }

        return NextResponse.json({ 
          received: true,
          order: updatedOrder
        });
      }

      return NextResponse.json({ received: true });

    } catch (error) {
      console.error('Webhook processing error:', error);

      // エラー情報をログに記録
      if (webhookLogId) {
        await supabase
          .from('webhook_logs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : '不明なエラー',
            processed_at: new Date().toISOString()
          })
          .eq('id', webhookLogId);
      }

      throw error;
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Webhook handler failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 