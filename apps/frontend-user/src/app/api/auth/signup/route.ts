import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password, temp_uid } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      )
    }

    // パスワードの長さチェック
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上である必要があります' },
        { status: 400 }
      )
    }

    // ユーザー登録
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('User creation error:', authError)
      return NextResponse.json(
        { error: 'ユーザー登録に失敗しました' },
        { status: 500 }
      )
    }

    // temp_uidが存在する場合、関連するデータを更新
    if (temp_uid) {
      const updates = [
        supabase
          .from('medical_interviews')
          .update({ user_id: authData.user.id })
          .eq('user_id', temp_uid),
        supabase
          .from('vendor_orders')
          .update({ user_id: authData.user.id })
          .eq('user_id', temp_uid)
      ]

      await Promise.all(updates)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'アカウント登録に失敗しました' },
      { status: 500 }
    )
  }
} 