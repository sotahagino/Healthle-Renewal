import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/dist/client/components/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { user_id, order_id } = await req.json()

    if (!user_id || !order_id) {
      return NextResponse.json(
        { error: 'user_id and order_id are required' },
        { status: 400 }
      )
    }

    console.log('Updating user_id for order:', { user_id, order_id })

    const { data: updateData, error: updateError } = await serviceClient
      .from('vendor_orders')
      .update({ 
        user_id,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    if (!updateData) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('Successfully updated user_id:', updateData)

    return NextResponse.json({
      success: true,
      data: updateData
    })

  } catch (error) {
    console.error('Error in update-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 