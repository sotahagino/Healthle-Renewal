import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id

    // 出店者情報を取得
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single()

    if (vendorError) {
      console.error('Vendor Error:', vendorError)
      return NextResponse.json(
        { error: '出店者情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // スタッフ情報を取得
    const { data: staffMembers, error: staffError } = await supabase
      .from('vendor_users')
      .select(`
        id,
        role,
        status,
        created_at,
        name,
        email,
        phone_number
      `)
      .eq('vendor_id', vendorId)
      .neq('role', 'Pharmacist')

    if (staffError) {
      console.error('Staff Error:', staffError)
      return NextResponse.json(
        { error: 'スタッフ情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 薬剤師情報を取得
    const { data: pharmacistUsers, error: pharmacistUsersError } = await supabase
      .from('vendor_users')
      .select(`
        id,
        name,
        email,
        phone_number,
        created_at
      `)
      .eq('vendor_id', vendorId)
      .eq('role', 'Pharmacist')

    if (pharmacistUsersError) {
      console.error('Pharmacist Users Error:', pharmacistUsersError)
      return NextResponse.json(
        { error: '薬剤師情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 薬剤師の免許情報を取得
    const { data: pharmacistLicenses, error: pharmacistLicensesError } = await supabase
      .from('vendor_pharmacists')
      .select(`
        id,
        user_id,
        license_number,
        verification_status,
        created_at
      `)
      .eq('vendor_id', vendorId)

    if (pharmacistLicensesError) {
      console.error('Pharmacist Licenses Error:', pharmacistLicensesError)
      return NextResponse.json(
        { error: '薬剤師免許情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // レスポンスデータの整形
    const responseData = {
      ...vendor,
      staff_members: staffMembers?.map(staff => ({
        id: staff.id,
        role: staff.role,
        status: staff.status,
        created_at: staff.created_at,
        user: {
          name: staff.name,
          email: staff.email,
          phone: staff.phone_number
        }
      })) || [],
      pharmacists: pharmacistUsers?.map(user => {
        const license = pharmacistLicenses?.find(
          license => license.user_id === user.id
        )
        return {
          id: user.id,
          license_number: license?.license_number || '',
          verification_status: license?.verification_status || 'pending',
          created_at: user.created_at,
          user: {
            name: user.name,
            email: user.email,
            phone: user.phone_number
          }
        }
      }) || []
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    )
  }
} 