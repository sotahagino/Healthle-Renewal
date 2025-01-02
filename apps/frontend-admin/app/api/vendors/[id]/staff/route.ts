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
    const { name, email, phone, role, status } = await request.json()

    console.log('Received data:', { vendorId, name, email, phone, role, status })

    // 1. まずusersテーブルにユーザーを作成
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          phone_number: phone
        }
      ])
      .select()
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json(
        { error: 'ユーザーの作成に失敗しました', details: userError.message },
        { status: 500 }
      )
    }

    console.log('Created user:', userData)

    // 2. vendor_usersテーブルに関連付けを作成
    const vendorUserData = {
      vendor_id: vendorId,
      user_id: userData.id,
      role,
      status,
      name,
      email,
      phone_number: phone
    }

    console.log('Attempting to insert vendor user:', vendorUserData)

    const { data: vendorUser, error: vendorUserError } = await supabase
      .from('vendor_users')
      .insert([vendorUserData])
      .select()

    if (vendorUserError) {
      console.error('Vendor user creation error:', vendorUserError)
      // ユーザー作成後にvendor_usersの作成に失敗した場合、作成したユーザーを削除
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userData.id)

      if (deleteError) {
        console.error('Error deleting user after failed vendor user creation:', deleteError)
      }

      return NextResponse.json(
        { 
          error: 'スタッフの関連付けに失敗しました', 
          details: vendorUserError.message,
          code: vendorUserError.code
        },
        { status: 500 }
      )
    }

    console.log('Successfully created vendor user:', vendorUser)
    return NextResponse.json({ success: true, data: userData })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'スタッフの追加に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
} 