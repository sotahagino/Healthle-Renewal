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

export async function POST(request: Request) {
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // 注文情報を更新
      const { error: updateError } = await supabase
        .from('vendor_orders')
        .update({
          status: 'paid',
          customer_email: session.customer_details?.email || session.customer_email,
          shipping_address: formatAddress(session.shipping_details?.address),
          shipping_name: session.shipping_details?.name,
          shipping_phone: session.customer_details?.phone,
          total_amount: session.amount_total,
          order_id: generateOrderId(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session.id)

      if (updateError) {
        console.error('Order update error:', updateError)
        return NextResponse.json(
          { error: '注文情報の更新に失敗しました' },
          { status: 500 }
        )
      }

      console.log('Order updated successfully:', {
        session_id: session.id,
        customer_email: session.customer_details?.email || session.customer_email
      })
    }

    return NextResponse.json({ message: 'Processed successfully' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook処理に失敗しました' },
      { status: 500 }
    )
  }
}

function formatAddress(address?: Stripe.Address | null): string {
  if (!address) return ''
  
  const parts = [
    address.postal_code,
    address.state,
    address.city,
    address.line1,
    address.line2
  ].filter(Boolean)
  
  return parts.join(' ')
}

function generateOrderId(): string {
  const date = new Date()
  const timestamp = date.getTime()
  const random = Math.random().toString(36).substring(2, 5)
  return `ORD${timestamp}${random}`
} 