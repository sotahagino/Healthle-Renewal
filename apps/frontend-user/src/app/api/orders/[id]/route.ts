import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // 注文情報の取得
    const { data: order, error: orderError } = await supabase
      .from('vendor_orders')
      .select(`
        id,
        order_id,
        created_at,
        status,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_phone,
        customer_email,
        product_id
      `)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (orderError) {
      console.error('Database error:', orderError)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error', 
          details: orderError.message 
        }),
        { status: 500 }
      )
    }

    if (!order) {
      return new NextResponse(
        JSON.stringify({ error: '注文が見つかりません' }),
        { status: 404 }
      )
    }

    // 商品情報の取得
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name')
      .eq('id', order.product_id)
      .single()

    if (productError) {
      console.error('Error fetching product:', productError)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Database error', 
          details: productError.message 
        }),
        { status: 500 }
      )
    }

    // レスポンスデータの整形
    const orderDetail = {
      ...order,
      product_name: product?.name || '不明な商品'
    }

    return new NextResponse(
      JSON.stringify(orderDetail),
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in GET /api/orders/[id]:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    )
  }
} 