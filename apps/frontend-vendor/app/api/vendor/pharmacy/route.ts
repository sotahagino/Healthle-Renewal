import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // セッションの確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // スタッフロールの確認
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('vendor_id, role, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    if (staffError || !staffRole) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 薬局情報の取得
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', staffRole.vendor_id)
      .single()

    if (pharmacyError) {
      throw pharmacyError
    }

    return NextResponse.json(pharmacy)
  } catch (error) {
    console.error('Pharmacy fetch error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const data = await request.json()

    // セッションの確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // スタッフロールの確認
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('vendor_id, role, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    if (staffError || !staffRole) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // 薬局情報の更新
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('vendors')
      .update({
        vendor_name: data.vendor_name,
        email: data.email,
        phone: data.phone,
        postal_code: data.postal_code,
        prefecture: data.prefecture,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        business_hours: data.business_hours,
        license_number: data.license_number,
        owner_name: data.owner_name,
        description: data.description,
        images: data.images,
        status: 'active',
      })
      .eq('id', staffRole.vendor_id)
      .select()
      .single()

    if (pharmacyError) {
      throw pharmacyError
    }

    return NextResponse.json(pharmacy)
  } catch (error) {
    console.error('Pharmacy update error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 