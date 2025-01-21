import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // セッションの確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      return new NextResponse(
        JSON.stringify({ error: 'Session error', details: sessionError.message }),
        { status: 401 }
      )
    }

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - No session' }),
        { status: 401 }
      )
    }

    console.log('Fetching orders for user:', session.user.id)

    // 注文情報の取得（外部結合を使用）
    const { data: orders, error: ordersError } = await supabase
      .from('vendor_orders')
      .select(`
        id,
        order_id,
        created_at,
        status,
        total_amount,
        shipping_name,
        shipping_address,
        product_id
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Database error:', ordersError)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error', 
          details: ordersError.message,
          hint: 'Failed to fetch orders from vendor_orders table'
        }),
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      console.log('No orders found for user:', session.user.id)
      return new NextResponse(
        JSON.stringify([]),
        { status: 200 }
      )
    }

    // 商品情報の取得
    const productIds = orders.map(order => order.product_id).filter(Boolean)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error', 
          details: productsError.message,
          hint: 'Failed to fetch products information'
        }),
        { status: 500 }
      )
    }

    // 商品情報をマップとして保持
    const productMap = new Map(
      products?.map(product => [product.id, product]) || []
    )

    // レスポンスデータの整形
    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_id: order.order_id,
      created_at: order.created_at,
      status: order.status,
      total_amount: order.total_amount,
      shipping_name: order.shipping_name,
      product_name: productMap.get(order.product_id)?.name || '不明な商品'
    }))

    console.log('Formatted orders:', JSON.stringify(formattedOrders, null, 2))

    return new NextResponse(
      JSON.stringify(formattedOrders),
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in GET /api/orders/list:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500 }
    )
  }
} 