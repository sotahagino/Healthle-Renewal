import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使用してクライアントを初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    console.log('Fetching vendor with ID:', vendorId)

    // 基本的な出店者情報の取得
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single()

    if (vendorError) {
      console.error('Vendor fetch error:', vendorError)
      return NextResponse.json(
        { error: `出店者情報の取得に失敗しました: ${vendorError.message}` },
        { status: 500 }
      )
    }

    if (!vendor) {
      return NextResponse.json(
        { error: '出店者が見つかりません' },
        { status: 404 }
      )
    }

    // スタッフ情報の取得（薬剤師以外）
    const { data: staffRoles, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('id, role, status, created_at, user_id')
      .eq('vendor_id', vendorId)
      .neq('role', 'pharmacist')

    if (staffError) {
      console.error('Staff fetch error:', staffError)
      return NextResponse.json(
        { error: `スタッフ情報の取得に失敗しました: ${staffError.message}` },
        { status: 500 }
      )
    }

    // スタッフのユーザー情報を取得
    const { data: { users: staffUsers }, error: staffUsersError } = await supabase.auth.admin.listUsers()

    if (staffUsersError) {
      console.error('Staff users fetch error:', staffUsersError)
      return NextResponse.json(
        { error: `スタッフユーザー情報の取得に失敗しました: ${staffUsersError.message}` },
        { status: 500 }
      )
    }

    console.log('Retrieved staff users:', staffUsers.length)

    // 薬剤師情報の取得
    const { data: pharmacistRoles, error: pharmacistError } = await supabase
      .from('vendor_staff_roles')
      .select(`
        id,
        role,
        status,
        created_at,
        user_id,
        pharmacist_certifications (
          id,
          license_number,
          license_image_url,
          verification_status,
          verified_at
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('role', 'pharmacist')

    if (pharmacistError) {
      console.error('Pharmacist fetch error:', pharmacistError)
      return NextResponse.json(
        { error: `薬剤師情報の取得に失敗しました: ${pharmacistError.message}` },
        { status: 500 }
      )
    }

    // スタッフと薬剤師のユーザー情報をマッピング
    const staffMembers = staffRoles?.map(staff => {
      const userData = staffUsers.find(user => user.id === staff.user_id)
      console.log('Mapping staff user:', userData?.id, userData?.user_metadata)
      return {
        id: staff.id,
        role: staff.role,
        status: staff.status,
        created_at: staff.created_at,
        user: userData ? {
          id: userData.id,
          email: userData.email,
          name: userData.user_metadata?.name,
          phone_number: userData.user_metadata?.phone_number
        } : null
      }
    }) || []

    const pharmacists = pharmacistRoles?.map(pharmacist => {
      const userData = staffUsers.find(user => user.id === pharmacist.user_id)
      return {
        id: pharmacist.id,
        role: pharmacist.role,
        status: pharmacist.status,
        created_at: pharmacist.created_at,
        user: userData ? {
          id: userData.id,
          email: userData.email,
          name: userData.user_metadata?.name,
          phone_number: userData.user_metadata?.phone_number
        } : null,
        certification: pharmacist.pharmacist_certifications?.[0] || null
      }
    }) || []

    // 住所を結合
    const address = [
      vendor.postal_code && `〒${vendor.postal_code}`,
      vendor.prefecture,
      vendor.city,
      vendor.address_line1,
      vendor.address_line2
    ].filter(Boolean).join(' ')

    const response = {
      ...vendor,
      address,
      staff_members: staffMembers,
      pharmacists
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: `予期せぬエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendorId = params.id
  
  try {
    const body = await request.json()
    const {
      vendor_name,
      status,
      email,
      phone,
      postal_code,
      prefecture,
      city,
      address_line1,
      address_line2,
      business_hours,
      consultation_hours,
      description,
    } = body

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update({
        vendor_name,
        status,
        email,
        phone,
        postal_code,
        prefecture,
        city,
        address_line1,
        address_line2,
        business_hours,
        consultation_hours,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating vendor:', error)
      throw error
    }

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { error: '出店者情報の更新に失敗しました' },
      { status: 500 }
    )
  }
} 