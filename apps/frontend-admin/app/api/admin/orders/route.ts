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
        users:user_id (
          name,
          email
        ),
        vendors:vendor_id (
          vendor_name
        )
      `)
      .order('created_at', { ascending: false })

    if (ordersError) {
      throw ordersError
    }

    // レスポンスデータの整形
    const formattedOrders = orders.map(order => ({
      id: order.id,
      user_id: order.user_id,
      vendor_id: order.vendor_id,
      total_amount: order.total_amount,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      vendor_name: order.vendors?.vendor_name || '不明',
      user_name: order.users?.name || '不明'
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: '注文情報の取得に失敗しました' },
      { status: 500 }
    )
  }
} 