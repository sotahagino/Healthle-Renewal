import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 注文情報の取得
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        vendor_id,
        total_amount,
        status,
        payment_status,
        created_at,
        updated_at,
        shipping_name,
        shipping_postal_code,
        shipping_prefecture,
        shipping_city,
        shipping_address,
        shipping_phone,
        users:user_id (
          name,
          email
        ),
        vendors:vendor_id (
          vendor_name
        )
      `)
      .eq('id', params.id)
      .single()

    if (orderError) {
      throw orderError
    }

    // 注文商品の取得
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        quantity,
        price,
        products:product_id (
          name
        )
      `)
      .eq('order_id', params.id)

    if (itemsError) {
      throw itemsError
    }

    // レスポンスデータの整形
    const formattedOrder = {
      id: order.id,
      user_id: order.user_id,
      vendor_id: order.vendor_id,
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      vendor_name: order.vendors?.vendor_name || '不明',
      user_name: order.users?.name || '不明',
      user_email: order.users?.email || '不明',
      shipping_address: `〒${order.shipping_postal_code} ${order.shipping_prefecture}${order.shipping_city}${order.shipping_address}`,
      items: orderItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || '不明',
        quantity: item.quantity,
        price: item.price
      }))
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: '注文情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'ステータスは必須です' },
        { status: 400 }
      )
    }

    // 注文ステータスの更新
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', params.id)
      .select(`
        id,
        user_id,
        vendor_id,
        total_amount,
        status,
        payment_status,
        created_at,
        updated_at,
        shipping_name,
        shipping_postal_code,
        shipping_prefecture,
        shipping_city,
        shipping_address,
        shipping_phone,
        users:user_id (
          name,
          email
        ),
        vendors:vendor_id (
          vendor_name
        )
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    // 注文商品の取得
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        quantity,
        price,
        products:product_id (
          name
        )
      `)
      .eq('order_id', params.id)

    if (itemsError) {
      throw itemsError
    }

    // レスポンスデータの整形
    const formattedOrder = {
      id: order.id,
      user_id: order.user_id,
      vendor_id: order.vendor_id,
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      vendor_name: order.vendors?.vendor_name || '不明',
      user_name: order.users?.name || '不明',
      user_email: order.users?.email || '不明',
      shipping_address: `〒${order.shipping_postal_code} ${order.shipping_prefecture}${order.shipping_city}${order.shipping_address}`,
      items: orderItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || '不明',
        quantity: item.quantity,
        price: item.price
      }))
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: '注文情報の更新に失敗しました' },
      { status: 500 }
    )
  }
} 