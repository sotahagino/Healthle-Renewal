import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { session_id, email } = await request.json()

    if (!session_id || !email) {
      return NextResponse.json(
        { error: 'セッションIDとメールアドレスは必須です' },
        { status: 400 }
      )
    }

    // vendor_ordersテーブルのcustomer_emailを更新
    const { data: orderData, error: orderError } = await supabase
      .from('vendor_orders')
      .update({ 
        customer_email: email,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session_id)
      .select()
      .single()

    if (orderError) {
      console.error('Update error:', orderError)
      return NextResponse.json(
        { error: 'メールアドレスの更新に失敗しました' },
        { status: 500 }
      )
    }

    if (!orderData) {
      return NextResponse.json(
        { error: '注文が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      order: orderData
    })
  } catch (error) {
    console.error('Update email error:', error)
    return NextResponse.json(
      { error: 'メールアドレスの更新に失敗しました' },
      { status: 500 }
    )
  }
} 