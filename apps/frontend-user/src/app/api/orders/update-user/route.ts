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
      console.error('Missing required fields:', { user_id, consultation_id })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Updating vendor_orders with:', { user_id, consultation_id })

    // vendor_ordersテーブルのuser_idを更新
    const { data: updateData, error: updateError } = await supabase
      .from('vendor_orders')
      .update({ 
        user_id,
        updated_at: new Date().toISOString()
      })
      .eq('consultation_id', consultation_id)
      .select()

    if (updateError) {
      console.error('Error updating vendor order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update vendor order' },
        { status: 500 }
      )
    }

    console.log('Update successful:', updateData)
    return NextResponse.json({ success: true, data: updateData })

  } catch (error) {
    console.error('Error in update-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 