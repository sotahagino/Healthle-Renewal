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

    // stripe_session_idを使って注文情報を取得し、同時にステータスを更新
    const { data: updatedOrder, error: updateError } = await supabase
      .from('vendor_orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id)
      .select('order_id, created_at, total_amount, product_id, status')
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
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
      .eq('id', updatedOrder.product_id)
      .single();

    console.log('Product query result:', {
      product,
      error: productError
    });

    // purchaseFlowデータを作成
    const purchaseFlowData = {
      order_id: updatedOrder.order_id,
      timestamp: Date.now(),
      product: {
        id: updatedOrder.product_id,
        name: product?.name || '',
        price: updatedOrder.total_amount
      },
      status: updatedOrder.status
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