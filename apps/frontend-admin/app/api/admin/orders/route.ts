import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 注文情報の取得
    const { data: orders, error: ordersError } = await supabase
      .from('vendor_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      throw ordersError
    }

    if (!orders) {
      console.error('No orders found')
      return NextResponse.json([])
    }

    // レスポンスデータの整形
    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_id: order.order_id,
      vendor_id: order.vendor_id,
      total_amount: order.total_amount,
      status: order.status,
      payment_status: 'paid', // vendor_ordersに登録される時点で支払い済み
      created_at: order.created_at,
      updated_at: order.updated_at,
      shipping_name: order.shipping_name,
      shipping_address: order.shipping_address,
      shipping_phone: order.shipping_phone,
      customer_email: order.customer_email,
      vendor_name: '出展者' + order.vendor_id,
      user_name: order.shipping_name || '不明'
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Error in GET /api/admin/orders:', error)
    return NextResponse.json(
      { error: '注文情報の取得に失敗しました' },
      { status: 500 }
    )
  }
} 