// frontend-vendor/app/api/vendor/auth/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// サービスロールキーを使用した管理者クライアントの作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { email, password, store_name } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    // メールアドレスとパスワードでサインアップ
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      return NextResponse.json(
        { error: 'サインアップに失敗しました' },
        { status: 400 }
      )
    }

    // 管理者権限でvendorsテーブルにデータを登録
    const { error: vendorError } = await supabaseAdmin
      .from('vendors')
      .insert([
        {
          id: authData.user?.id,
          email: email,
          vendor_name: store_name,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])

    if (vendorError) {
      console.error('Vendor registration error:', vendorError)
      return NextResponse.json(
        { error: '店舗情報の登録に失敗しました' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: '登録が完了しました' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
}