import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const vendorId = context.params.id

  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      role,
      license_number,
      license_image_url
    } = body

    // 薬剤師の場合、ライセンス情報の必須チェック
    if (role === 'pharmacist' && (!license_number || !license_image_url)) {
      throw new Error('薬剤師の場合、ライセンス番号と画像は必須です')
    }

    // 1. auth.usersにユーザーを作成
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: '12345678',
      email_confirm: true,
      user_metadata: {
        name,
        phone_number: phone,
        role
      }
    })

    if (authError || !userData.user) {
      console.error('Auth user creation error:', authError)
      throw new Error(`認証ユーザーの作成に失敗しました: ${authError?.message || 'Unknown error'}`)
    }

    // 2. public.usersテーブルにユーザー情報を作成
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userData.user.id,
        name,
        email,
        phone_number: phone,
        user_type: 'vendor_staff'
      })

    if (userError) {
      // ロールバック: auth.usersから削除
      await supabase.auth.admin.deleteUser(userData.user.id)
      console.error('User creation error:', userError)
      throw new Error(`ユーザー情報の作成に失敗しました: ${userError.message}`)
    }

    // 3. スタッフロールの作成
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .insert({
        vendor_id: vendorId,
        user_id: userData.user.id,
        role,
        status: 'active'
      })
      .select()
      .single()

    if (staffError || !staffRole) {
      // ロールバック: auth.usersとusersから削除
      await supabase.auth.admin.deleteUser(userData.user.id)
      await supabase.from('users').delete().eq('id', userData.user.id)
      console.error('Staff role creation error:', staffError)
      throw new Error(`スタッフロールの作成に失敗しました: ${staffError?.message || 'Unknown error'}`)
    }

    // 4. 薬剤師の場合のみ、資格情報を追加
    if (role === 'pharmacist') {
      const { error: certError } = await supabase
        .from('pharmacist_certifications')
        .insert({
          staff_role_id: staffRole.id,
          license_number,
          license_image_url,
          verification_status: 'pending'
        })

      if (certError) {
        // ロールバック: auth.users、users、staff_rolesから削除
        await supabase.auth.admin.deleteUser(userData.user.id)
        await supabase.from('users').delete().eq('id', userData.user.id)
        await supabase
          .from('vendor_staff_roles')
          .delete()
          .eq('id', staffRole.id)
        console.error('Pharmacist certification error:', certError)
        throw new Error(`薬剤師資格情報の登録に失敗しました: ${certError.message}`)
      }
    }

    return NextResponse.json({
      message: 'スタッフを追加しました',
      staff: {
        ...staffRole,
        user: {
          id: userData.user.id,
          name,
          email,
          phone_number: phone
        }
      }
    })

  } catch (error) {
    console.error('Error adding staff:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'スタッフの追加に失敗しました',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const vendorId = await context.params.id

  try {
    const body = await request.json()
    const {
      staff_id,
      name,
      email,
      phone_number,
      status,
      license_number,
      license_image_url,
      verification_status
    } = body

    // 1. スタッフロールの取得
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('*')
      .eq('id', staff_id)
      .eq('vendor_id', vendorId)
      .single()

    if (staffError) throw staffError

    // 2. ユーザー情報の更新
    const { error: userError } = await supabase
      .from('users')
      .update({
        name,
        email,
        phone_number
      })
      .eq('id', staffRole.user_id)

    if (userError) throw userError

    // 3. スタッフステータスの更新
    const { error: statusError } = await supabase
      .from('vendor_staff_roles')
      .update({ status })
      .eq('id', staff_id)

    if (statusError) throw statusError

    // 4. 薬剤師の場合、資格情報の更新
    if (staffRole.role === 'pharmacist') {
      const { error: certError } = await supabase
        .from('pharmacist_certifications')
        .update({
          license_number,
          license_image_url,
          verification_status
        })
        .eq('staff_role_id', staff_id)

      if (certError) throw certError
    }

    return NextResponse.json({
      message: 'スタッフ情報を更新しました'
    })

  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { error: 'スタッフ情報の更新に失敗しました' },
      { status: 500 }
    )
  }
} 