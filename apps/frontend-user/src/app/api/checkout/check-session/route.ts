import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/dist/client/components/headers';
import { stripe } from '@/lib/stripe';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return new NextResponse(
        JSON.stringify({ error: 'Payment Intent IDが必要です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    // PaymentIntentの状態を確認（customer情報も取得）
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['shipping', 'customer']
    });

    if (!paymentIntent) {
      return new NextResponse(
        JSON.stringify({ error: 'Payment Intentが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('PaymentIntent status:', paymentIntent.status);
    console.log('PaymentIntent metadata:', paymentIntent.metadata);

    // 既存の注文を確認
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('vendor_orders')
      .select('*')
      .eq('stripe_session_id', paymentIntentId)
      .single();

    if (existingOrderError && existingOrderError.code !== 'PGRST116') {
      console.error('Error checking existing order:', existingOrderError);
      return new NextResponse(
        JSON.stringify({ error: '注文情報の確認に失敗しました', details: existingOrderError }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (paymentIntent.status === 'succeeded' && !existingOrder) {
      // 商品情報の取得
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', paymentIntent.metadata.product_id)
        .single();

      if (productError) {
        console.error('Error fetching product:', productError);
        return new NextResponse(
          JSON.stringify({ error: '商品情報の取得に失敗しました', details: productError }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (!product) {
        console.error('Product not found for ID:', paymentIntent.metadata.product_id);
        return new NextResponse(
          JSON.stringify({ error: '商品情報が見つかりません', product_id: paymentIntent.metadata.product_id }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // 注文情報を作成
      const orderId = nanoid();
      const shippingInfo = paymentIntent.shipping?.address ? {
        name: paymentIntent.shipping.name,
        phone: paymentIntent.shipping.phone,
        address: {
          postal_code: paymentIntent.shipping.address.postal_code,
          state: paymentIntent.shipping.address.state,
          city: paymentIntent.shipping.address.city,
          line1: paymentIntent.shipping.address.line1,
          line2: paymentIntent.shipping.address.line2 || null
        }
      } : null;

      // メールアドレスの取得（PaymentIntentのcustomerから）
      const customerEmail = paymentIntent.receipt_email || 
        (typeof paymentIntent.customer === 'string' ? 
          await stripe.customers.retrieve(paymentIntent.customer)
            .then(customer => 'deleted' in customer ? null : customer.email)
            .catch(() => null) : 
          null);

      const orderData = {
        order_id: orderId,
        user_id: session?.user?.id || null,
        product_id: product.id,
        vendor_id: product.vendor_id,
        interview_id: paymentIntent.metadata.medical_interview_id || null,
        total_amount: paymentIntent.amount,
        status: 'paid',
        stripe_session_id: paymentIntentId,
        shipping_info: shippingInfo,
        shipping_name: paymentIntent.shipping?.name,
        shipping_address: paymentIntent.shipping?.address ? 
          `〒${paymentIntent.shipping.address.postal_code} ${paymentIntent.shipping.address.state}${paymentIntent.shipping.address.city}${paymentIntent.shipping.address.line1}${paymentIntent.shipping.address.line2 ? ' ' + paymentIntent.shipping.address.line2 : ''}` : null,
        shipping_phone: paymentIntent.shipping?.phone,
        customer_email: customerEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('PaymentIntent metadata:', paymentIntent.metadata);
      console.log('Inserting order data:', orderData);

      const { error: insertError } = await supabase
        .from('vendor_orders')
        .insert([orderData]);

      if (insertError) {
        console.error('Error creating order:', insertError);
        return new NextResponse(
          JSON.stringify({ 
            error: '注文情報の作成に失敗しました', 
            details: insertError,
            order_data: orderData 
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new NextResponse(
        JSON.stringify({
          status: 'success',
          order_id: orderId,
          payment_status: paymentIntent.status,
          customer_email: customerEmail
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        status: 'pending',
        payment_status: paymentIntent.status
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Check session error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: '決済状態の確認中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 