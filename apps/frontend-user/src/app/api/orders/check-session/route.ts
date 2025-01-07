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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOrderWithRetry(sessionId: string, attempt: number = 1): Promise<any> {
  try {
    const { data: order, error } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error) {
      throw error;
    }

    if (!order && attempt < MAX_RETRIES) {
      console.log(`Order not found, attempt ${attempt} of ${MAX_RETRIES}`);
      await wait(RETRY_DELAY * Math.pow(2, attempt - 1));
      return getOrderWithRetry(sessionId, attempt + 1);
    }

    return order;
  } catch (error) {
    console.error(`Error fetching order (attempt ${attempt}):`, error);
    if (attempt < MAX_RETRIES) {
      await wait(RETRY_DELAY * Math.pow(2, attempt - 1));
      return getOrderWithRetry(sessionId, attempt + 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const session_id = url.searchParams.get('session_id');
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

    // リトライロジックを使用して注文情報を取得
    const order = await getOrderWithRetry(session.id);

    if (!order) {
      console.error('Order not found after all retries');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 注文ステータスを更新
    const { error: updateError } = await supabase
      .from('vendor_orders')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw updateError;
    }

    // 配送先情報を更新（存在する場合）
    if (session.shipping_details) {
      const { error: shippingError } = await supabase
        .from('vendor_orders')
        .update({
          shipping_name: session.shipping_details.name,
          shipping_address: `〒${session.shipping_details.address?.postal_code || ''} ${session.shipping_details.address?.state || ''}${session.shipping_details.address?.city || ''}${session.shipping_details.address?.line1 || ''}${session.shipping_details.address?.line2 ? ' ' + session.shipping_details.address.line2 : ''}`,
          shipping_phone: session.shipping_details.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (shippingError) {
        console.error('Error updating shipping information:', shippingError);
        // 配送情報の更新エラーは致命的ではないため、続行
      }
    }

    return NextResponse.json({
      order_id: order.order_id,
      status: 'paid',
      shipping_details: session.shipping_details,
      customer_details: session.customer_details
    });

  } catch (error: any) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check session',
        details: error.stack
      },
      { status: error.status || 500 }
    );
  }
}

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

    // vendor_ordersテーブルから注文情報を取得
    const { data: order, error: orderError } = await supabase
      .from('vendor_orders')
      .select('order_id, created_at, total_amount, product_id')
      .eq('stripe_session_id', session_id)
      .single();

    console.log('Order query result:', {
      order,
      error: orderError,
      email: session.customer_details?.email
    });

    if (orderError || !order) {
      console.warn('No order found for session');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 商品情報を取得
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name')
      .eq('id', order.product_id)
      .single();

    console.log('Product query result:', {
      product,
      error: productError
    });

    // purchaseFlowデータを作成
    const purchaseFlowData = {
      order_id: order.order_id,
      timestamp: Date.now(),
      product: {
        id: order.product_id,
        name: product?.name || '',
        price: order.total_amount
      }
    };

    console.log('Created purchaseFlow data:', purchaseFlowData);

    return NextResponse.json(purchaseFlowData);

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
} 