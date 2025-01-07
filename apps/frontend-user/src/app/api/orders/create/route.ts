import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // リクエストボディを取得
    const { product_id, user_id, client_reference_id, metadata } = await req.json()

    if (!product_id || !user_id) {
      return NextResponse.json(
        { error: 'product_id and user_id are required' },
        { status: 400 }
      )
    }

    // 商品情報を取得
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      console.error('Product fetch error:', productError)
      return NextResponse.json(
        { error: '商品情報の取得に失敗しました' },
        { status: 404 }
      )
    }

    // 注文番号を生成
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substring(2, 7)}`

    // vendor_ordersテーブルに仮の注文レコードを作成
    const { data: orderData, error: orderError } = await supabase
      .from('vendor_orders')
      .insert([
        {
          order_id: orderNumber,
          user_id: user_id,
          product_id: product_id,
          vendor_id: product.vendor_id,
          total_amount: product.price,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: '注文の作成に失敗しました' },
        { status: 500 }
      )
    }

    // Stripeチェックアウトセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: product.name,
              description: product.description || undefined,
              images: product.image_url ? [product.image_url] : undefined,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/purchase-complete?session_id={CHECKOUT_SESSION_ID}`
        : `https://healthle-renewal-p8nm.vercel.app/purchase-complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/result`
        : `https://healthle-renewal-p8nm.vercel.app/result`,
      client_reference_id: orderNumber,
      metadata: {
        user_id: user_id,
        product_id: product_id,
        ...metadata
      },
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'jpy',
            },
            display_name: '通常配送',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
      ],
    })

    // 注文レコードを更新してStripeセッションIDを保存
    const { error: updateError } = await supabase
      .from('vendor_orders')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderNumber)

    if (updateError) {
      console.error('Order update error:', updateError)
      // エラーはログに残すが、ユーザーフローは継続
    }

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error in create order API:', error)
    return NextResponse.json(
      { error: '注文処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
} 