import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// 注文ステータスの定義
const ORDER_STATUS = {
  PENDING: 'pending',           // 支払い待ち
  PAID: 'paid',                // 支払い完了
  PREPARING: 'preparing',      // 発送準備中
  SHIPPED: 'shipped',          // 発送済み
  DELIVERED: 'delivered',      // 配達完了
  CANCELLED: 'cancelled'       // キャンセル
} as const;

export async function POST(request: Request) {
  let webhookLogId: string | null = null;
  
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing stripe-signature or webhook secret' },
        { status: 400 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    console.log('Received Stripe event:', {
      id: event.id,
      type: event.type,
      api_version: event.api_version
    });

    // webhookログを保存
    try {
      const { data: logData, error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          status: 'processing',
          processed_at: new Date().toISOString(),
          processed_data: null,
          error_message: null
        })
        .select()
        .single()

      if (logError) {
        console.error('Webhook log creation error:', {
          error: logError,
          details: logError.details,
          message: logError.message
        });
      } else {
        webhookLogId = logData.id;
        console.log('Created webhook log:', logData);
      }
    } catch (logError) {
      console.error('Failed to create webhook log:', logError);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

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
        console.log('Shipping info:', shippingInfo);

        // 商品情報を取得
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', session.metadata?.product_id)
          .single();

        if (productError) {
          throw productError;
        }

        // 注文情報を更新
        const orderData = {
          status: ORDER_STATUS.PAID,
          customer_email: session.customer_details?.email || '',
          shipping_name: shippingInfo.name,
          shipping_address: `〒${shippingInfo.postal_code} ${shippingInfo.prefecture}${shippingInfo.city}${shippingInfo.address}`,
          shipping_phone: shippingInfo.phone,
          total_amount: session.amount_total || 0,
          updated_at: new Date().toISOString()
        };

        console.log('Updating order with data:', orderData);

        // 現在の注文情報を取得
        const { data: currentOrder, error: fetchError } = await supabase
          .from('vendor_orders')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();

        if (fetchError) {
          throw new Error(`現在の注文情報の取得に失敗しました: ${fetchError.message}`);
        }

        console.log('Current order before update:', currentOrder);

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

        console.log('Updated order after update:', updatedOrder);

        // ユーザー情報も更新
        if (session.client_reference_id) {
          await updateUserShippingInfo(session.client_reference_id, session.shipping_details);
        }

        // 処理成功をログに記録
        if (webhookLogId) {
          const { error: updateError } = await supabase
            .from('webhook_logs')
            .update({
              status: 'success',
              processed_data: {
                order_before: currentOrder,
                order_after: updatedOrder,
                shipping_info: shippingInfo,
                product: product
              },
              processed_at: new Date().toISOString()
            })
            .eq('id', webhookLogId);

          if (updateError) {
            console.error('Failed to update webhook log status:', updateError);
          }
        }

        return NextResponse.json({ message: 'Processed successfully' });
      } catch (error) {
        // エラー情報をログに記録
        if (webhookLogId) {
          try {
            await supabase
              .from('webhook_logs')
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : '不明なエラー',
                processed_at: new Date().toISOString()
              })
              .eq('id', webhookLogId);
          } catch (logError) {
            console.error('Failed to update webhook log with error:', logError);
          }
        }

        throw error;
      }
    }

    return NextResponse.json({ message: 'Processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);

    // エラー情報をログに記録
    if (webhookLogId) {
      try {
        await supabase
          .from('webhook_logs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : '不明なエラー',
            processed_at: new Date().toISOString()
          })
          .eq('id', webhookLogId);
      } catch (logError) {
        console.error('Failed to update webhook log with error:', logError);
      }
    }

    return NextResponse.json(
      { error: 'Webhook処理に失敗しました' },
      { status: 500 }
    );
  }
}

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

function formatAddress(address?: Stripe.Address | null): string {
  if (!address) return '';
  
  return `〒${address.postal_code} ${address.state}${address.city}${address.line1}${address.line2 ? ' ' + address.line2 : ''}`;
}

function generateOrderId(): string {
  const date = new Date()
  const timestamp = date.getTime()
  const random = Math.random().toString(36).substring(2, 5)
  return `ORD${timestamp}${random}`
} 