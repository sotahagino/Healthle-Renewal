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

// LINE Messaging APIのクライアント設定
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';
const LINE_HEADER = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
};

// LINEメッセージを送信する関数
async function sendLineNotification(userId: string, orderId: string, productName: string) {
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('line_user_id')
      .eq('id', userId)
      .single();

    if (!userData?.line_user_id) {
      console.log('LINE user ID not found for user:', userId);
      return;
    }

    const message = {
      to: userData.line_user_id,
      messages: [
        {
          type: 'text',
          text: `ご注文ありがとうございます！\n\n商品：${productName}\n注文番号：${orderId}\n\n商品の発送準備が整い次第、改めてご連絡させていただきます。`
        }
      ]
    };

    const response = await fetch(LINE_MESSAGING_API, {
      method: 'POST',
      headers: LINE_HEADER,
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error('Failed to send LINE notification');
    }

    console.log('LINE notification sent successfully');
  } catch (error) {
    console.error('Error sending LINE notification:', error);
    // 通知の失敗は全体の処理を止めない
  }
}

// 在庫を更新する関数
async function updateProductStock(productId: string) {
  try {
    // トランザクションで在庫を減算
    const { data: product, error: selectError } = await supabase
      .from('products')
      .select('stock_quantity, stock_status')
      .eq('id', productId)
      .single();

    if (selectError) throw selectError;

    const newStock = (product?.stock_quantity || 0) - 1;
    const newStatus = newStock <= 0 ? 'out_of_stock' : newStock <= 5 ? 'low_stock' : 'in_stock';

    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newStock,
        stock_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) throw updateError;

    // 在庫切れの場合、Stripe Payment Linkを無効化
    if (newStock <= 0) {
      const { data: productData } = await supabase
        .from('products')
        .select('stripe_payment_link_id')
        .eq('id', productId)
        .single();

      if (productData?.stripe_payment_link_id) {
        await stripe.paymentLinks.update(productData.stripe_payment_link_id, {
          active: false
        });
      }
    }

    console.log('Stock updated successfully:', {
      product_id: productId,
      new_stock: newStock,
      new_status: newStatus
    });
  } catch (error) {
    console.error('在庫更新エラー:', error);
    throw error;
  }
}

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

// 注文情報を保存する関数
async function createOrderRecords(
  session: Stripe.Checkout.Session,
  product: any,
  orderNumber: string
) {
  try {
    // セッション情報のログ出力
    console.log('Session details:', {
      id: session.id,
      metadata: session.metadata,
      client_reference_id: session.client_reference_id,
      customer_details: session.customer_details,
      shipping_details: session.shipping_details
    });

    // consultation_idの取得と確認
    const consultation_id = session.metadata?.consultation_id
    console.log('Received consultation_id from session metadata:', consultation_id)

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

    // ユーザーIDの取得
    const user_id = session.client_reference_id;
    console.log('Received user_id from session:', user_id)

    // 出展者向け注文情報の保存
    const vendorOrderData = {
      order_id: orderNumber,
      vendor_id: product.vendor_id,
      product_id: product.id,
      user_id: null,  // 後から更新できるようにnullで保存
      status: 'paid',
      total_amount: session.amount_total,
      commission_rate: product.commission_rate || 10,
      shipping_name: shippingInfo.name,
      shipping_address: `〒${shippingInfo.postal_code} ${shippingInfo.prefecture}${shippingInfo.city}${shippingInfo.address}`,
      shipping_phone: shippingInfo.phone,
      customer_email: session.customer_details?.email || '',
      consultation_id: null,  // 後から更新できるようにnullで保存
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating vendor order with data:', vendorOrderData);

    const { data: insertedOrder, error: vendorOrderError } = await supabase
      .from('vendor_orders')
      .insert([vendorOrderData])
      .select()
      .single();

    if (vendorOrderError) {
      console.error('Failed to create vendor order:', {
        error: vendorOrderError,
        errorMessage: vendorOrderError.message,
        details: vendorOrderError.details,
        hint: vendorOrderError.hint
      });
      throw vendorOrderError;
    }

    console.log('Successfully created vendor order:', insertedOrder);

    // purchaseFlowデータを作成してlocalStorageに保存
    const purchaseFlowData = {
      order_id: orderNumber,
      timestamp: Date.now(),
      product: {
        id: product.id,
        name: product.name,
        price: session.amount_total
      }
    };

    // localStorageに保存するためのスクリプトをクライアントに送信
    const script = `
      try {
        localStorage.setItem('purchaseFlow', '${JSON.stringify(purchaseFlowData)}');
        console.log('Successfully saved purchaseFlow:', ${JSON.stringify(purchaseFlowData)});
      } catch (error) {
        console.error('Failed to save purchaseFlow:', error);
      }
    `;

    // 管理システム用の注文トラッキング情報の保存
    const orderTrackingData = {
      order_id: orderNumber,
      current_status: 'paid',
      payment_confirmed_at: new Date().toISOString(),
      status_history: [{
        status: 'paid',
        timestamp: new Date().toISOString(),
        note: '決済完了'
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating order tracking with data:', orderTrackingData);

    const { data: insertedTracking, error: trackingError } = await supabase
      .from('order_tracking')
      .insert([orderTrackingData])
      .select()
      .single();

    if (trackingError) {
      console.error('Failed to create order tracking:', {
        error: trackingError,
        errorMessage: trackingError.message,
        details: trackingError.details,
        hint: trackingError.hint
      });
      throw trackingError;
    }

    console.log('Successfully created order tracking:', insertedTracking);

    return {
      vendorOrderData,
      orderTrackingData,
      purchaseFlowData,
      script
    };
  } catch (error) {
    console.error('注文情報の保存に失敗:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// 注文処理を行う関数
async function processOrder(
  session: Stripe.Checkout.Session,
  product: any,
  event: Stripe.Event
) {
  try {
    console.log('Starting order processing:', {
      session_id: session.id,
      product_id: product.id,
      event_id: event.id
    });

    // 注文番号の生成
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substring(2, 7)}`;
    console.log('Generated order number:', orderNumber);

    // success_urlにorder_idを追加
    if (session.success_url) {
      try {
        const successUrl = new URL(session.success_url);
        successUrl.searchParams.append('order_id', orderNumber);
        await stripe.checkout.sessions.modify(session.id, {
          success_url: successUrl.toString()
        });
        console.log('Updated success_url with order_id:', successUrl.toString());
      } catch (error) {
        console.error('Failed to update success_url:', error);
        // success_urlの更新に失敗しても処理は続行
      }
    } else {
      console.warn('No success_url found in session');
    }

    // 注文関連情報の保存
    console.log('Saving order records...');
    const orderData = await createOrderRecords(session, product, orderNumber);
    console.log('Order records saved successfully:', orderData);

    // 在庫を更新
    console.log('Updating product stock...');
    await updateProductStock(product.id);
    console.log('Product stock updated successfully');

    // Webhookログを更新
    console.log('Updating webhook log...');
    const { error: updateError } = await supabase
      .from('webhook_logs')
      .update({ 
        status: 'completed',
        processed_data: {
          order_id: orderNumber,
          product_id: product.id,
          vendor_id: product.vendor_id,
          payment_link: session.payment_link,
          stripe_price_id: product.stripe_price_id,
          timestamp: Date.now(),
          purchase_flow: orderData.purchaseFlowData
        }
      })
      .eq('stripe_event_id', event.id);

    if (updateError) {
      console.error('Failed to update webhook log:', updateError);
      throw updateError;
    }
    console.log('Webhook log updated successfully');

    // LINE通知を送信（ユーザーIDがある場合）
    if (session.client_reference_id) {
      console.log('Sending LINE notification...');
      await sendLineNotification(
        session.client_reference_id,
        orderNumber,
        product.name
      );
    }

    console.log('Order processing completed successfully');
    return NextResponse.json({ 
      received: true,
      order_number: orderNumber,
      order_id: orderNumber,
      purchase_flow: orderData.purchaseFlowData,
      script: orderData.script
    });
  } catch (error) {
    console.error('Error in processOrder:', error);
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

    // Webhookの重複処理を防ぐ
    const { data: existingLog } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingLog) {
      return NextResponse.json({ message: 'Already processed' });
    }

    // Webhookログを作成
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert([
        {
          stripe_event_id: event.id,
          event_type: event.type,
          status: 'processing'
        }
      ]);

    if (logError) throw logError;

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Webhook event received:', {
          event_type: event.type,
          event_id: event.id,
          payment_link: session.payment_link,
          client_reference_id: session.client_reference_id,
          amount_total: session.amount_total,
        });

        if (!session.payment_link) {
          throw new Error('Payment link is required but not provided');
        }

        // payment_linkの詳細をログ出力
        const paymentLinkId = typeof session.payment_link === 'string' 
          ? session.payment_link 
          : session.payment_link.id;
        
        console.log('Payment link details:', {
          id: paymentLinkId,
          raw_value: session.payment_link
        });

        // まずpayment_link_idで商品を検索
        let product = null;
        let productError = null;

        const { data: productById, error: idError } = await supabase
          .from('products')
          .select('*, vendor:vendor_id(*)')
          .eq('stripe_payment_link_id', paymentLinkId)
          .single();

        if (productById) {
          product = productById;
          console.log('Product found by payment_link_id:', product);
        } else {
          productError = idError;
          console.log('Product not found by payment_link_id, error:', idError);

          // 代替の検索方法を試行
          const { data: productByUrl, error: urlError } = await supabase
            .from('products')
            .select('*, vendor:vendor_id(*)')
            .eq('stripe_payment_link_url', session.payment_link)
            .single();

          if (productByUrl) {
            product = productByUrl;
            console.log('Product found by payment_link_url:', product);
            
            // stripe_payment_link_idを更新
            const { error: updateError } = await supabase
              .from('products')
              .update({ stripe_payment_link_id: paymentLinkId })
              .eq('id', product.id);

            if (updateError) {
              console.error('Failed to update payment_link_id:', updateError);
            }
          } else {
            productError = urlError;
            console.log('Product not found by payment_link_url, error:', urlError);
          }
        }

        // 商品が見つからない場合、全商品の情報をログ出力
        if (!product) {
          const { data: allProducts } = await supabase
            .from('products')
            .select('id, name, stripe_payment_link_id, stripe_payment_link_url');
          
          const errorMessage = `Product not found. Payment Link ID: ${paymentLinkId}, URL: ${session.payment_link}. Available products: ${JSON.stringify(allProducts?.map(p => ({ id: p.id, name: p.name })))}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }

        return await processOrder(session, product, event);
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      // エラー発生時はWebhookログを更新
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : 'Unknown error occurred';

      console.error('Webhook processing error:', {
        error: errorMessage,
        event_type: event.type,
        event_id: event.id
      });

      await supabase
        .from('webhook_logs')
        .update({ 
          status: 'failed',
          error_message: errorMessage,
          processed_data: {
            event_type: event.type,
            error_details: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          }
        })
        .eq('stripe_event_id', event.id);

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