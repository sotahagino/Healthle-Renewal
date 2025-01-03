import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { user_id, consultation_id } = await request.json()

    if (!user_id || !consultation_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // consultation_idを使用して対応するvendor_ordersレコードを検索
    const { data: vendorOrder, error: selectError } = await supabase
      .from('vendor_orders')
      .select('id')
      .eq('consultation_id', consultation_id)
      .single()

    if (selectError) {
      console.error('Error finding vendor order:', selectError)
      return NextResponse.json(
        { error: 'Failed to find vendor order' },
        { status: 404 }
      )
    }

    // vendor_ordersテーブルのuser_idを更新
    const { error: updateError } = await supabase
      .from('vendor_orders')
      .update({ user_id })
      .eq('consultation_id', consultation_id)

    if (updateError) {
      console.error('Error updating vendor order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update vendor order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in update-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 