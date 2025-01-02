import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const vendorId = await Promise.resolve(context.params.id)
    const { name, email, phone, licenseNumber, verificationStatus } = await request.json()

    console.log('Received data:', { vendorId, name, email, phone, licenseNumber, verificationStatus })

    // 1. auth.usersテーブルにユーザーを作成
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        name,
        phone_number: phone
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { error: '認証ユーザーの作成に失敗しました', details: authError.message },
        { status: 500 }
      )
    }

    console.log('Created auth user:', authUser)

    // 2. usersテーブルにユーザー情報を作成
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.user.id, // auth.usersのIDを使用
          name,
          email,
          phone_number: phone
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      // auth.usersから作成したユーザーを削除
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'ユーザーの作成に失敗しました', details: userError.message },
        { status: 500 }
      )
    }

    console.log('Created user:', userData)

    // 3. vendor_pharmacistsテーブルに関連付けを作成
    const pharmacistData = {
      vendor_id: vendorId,
      user_id: authUser.user.id,
      license_number: licenseNumber,
      verification_status: verificationStatus
    }

    console.log('Attempting to insert pharmacist:', pharmacistData)

    const { data: pharmacist, error: pharmacistError } = await supabase
      .from('vendor_pharmacists')
      .insert([pharmacistData])
      .select()

    if (pharmacistError) {
      console.error('Pharmacist creation error:', pharmacistError)
      // ユールバック: 作成したユーザーを削除
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase
        .from('users')
        .delete()
        .eq('id', authUser.user.id)

      return NextResponse.json(
        { 
          error: '薬剤師の関連付けに失敗しました', 
          details: pharmacistError.message,
          code: pharmacistError.code
        },
        { status: 500 }
      )
    }

    // 4. vendor_usersテーブルにも薬剤師として登録
    const { error: vendorUserError } = await supabase
      .from('vendor_users')
      .insert([
        {
          vendor_id: vendorId,
          user_id: authUser.user.id,
          role: 'Pharmacist',
          status: 'active',
          name,
          email,
          phone_number: phone
        }
      ])

    if (vendorUserError) {
      console.error('Vendor user creation error:', vendorUserError)
    }

    console.log('Successfully created pharmacist:', pharmacist)
    return NextResponse.json({ success: true, data: pharmacist })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: '薬剤師の追加に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
} 