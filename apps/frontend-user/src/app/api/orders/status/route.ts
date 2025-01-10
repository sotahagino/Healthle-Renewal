import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return new NextResponse(
      JSON.stringify({ error: 'Session ID is required' }),
      { status: 400 }
    )
  }

  const supabase = getSupabaseClient()

  try {
    // 注文情報を取得
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      throw orderError
    }

    if (!order) {
      return new NextResponse(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404 }
      )
    }

    // 一時的なユーザー情報を取得
    const { data: tempUser, error: tempUserError } = await supabase
      .from('temp_users')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single()

    if (tempUserError && tempUserError.code !== 'PGRST116') {
      console.error('Error fetching temporary user:', tempUserError)
      throw tempUserError
    }

    return new NextResponse(
      JSON.stringify({
        orderId: order.id,
        status: order.status,
        customerEmail: order.customer_email || tempUser?.email
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking order status:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to check order status' }),
      { status: 500 }
    )
  }
} 