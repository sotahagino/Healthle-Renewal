import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_KEY is not set')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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
    const { error: updateError } = await supabase
      .from('vendor_orders')
      .update({ customer_email: email })
      .eq('stripe_session_id', session_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'メールアドレスの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update email error:', error)
    return NextResponse.json(
      { error: 'メールアドレスの更新に失敗しました' },
      { status: 500 }
    )
  }
} 