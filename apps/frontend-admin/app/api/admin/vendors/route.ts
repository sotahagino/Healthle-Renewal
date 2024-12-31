import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Roleキーを使用してSupabaseクライアントを初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const {
      vendor_name,
      email,
      phone,
      postal_code,
      address,
      business_hours,
      description,
      owner_email,
      owner_password
    } = await req.json()

    // リクエストデータのログ（本番環境では削除）
    console.log('Request data:', {
      vendor_name,
      email,
      phone,
      postal_code,
      address,
      business_hours,
      description,
      owner_email
      // パスワードはログに出力しない
    })

    // 1. 出店者（店舗）をvendorsテーブルに登録
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert([
        { 
          vendor_name,
          email,
          phone,
          postal_code,
          address,
          business_hours,
          description,
          status: 'active'
        }
      ])
      .select()
      .single()

    if (vendorError) {
      console.error('Vendor creation error details:', {
        code: vendorError.code,
        message: vendorError.message,
        details: vendorError.details,
        hint: vendorError.hint
      })
      throw new Error(`店舗の登録に失敗しました: ${vendorError.message}`)
    }

    // 2. オーナーユーザーをauth.usersに作成
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: owner_email,
      password: owner_password,
      email_confirm: true
    })

    if (userError) {
      console.error('User creation error details:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint
      })
      // ロールバック
      await supabase.from('vendors').delete().eq('id', vendor.id)
      throw new Error(`ユーザーの作成に失敗しました: ${userError.message}`)
    }

    // 3. vendor_usersテーブルに紐付けを作成
    const { error: linkError } = await supabase
      .from('vendor_users')
      .insert([
        {
          vendor_id: vendor.id,
          user_id: user.id,
          role: 'Owner',
          status: 'active'  // statusカラムは必須
        }
      ])

    if (linkError) {
      console.error('Vendor-user link error details:', {
        code: linkError.code,
        message: linkError.message,
        details: linkError.details,
        hint: linkError.hint
      })
      // ロールバック
      await supabase.auth.admin.deleteUser(user.id)
      await supabase.from('vendors').delete().eq('id', vendor.id)
      throw new Error(`店舗とユーザーの紐付けに失敗しました: ${linkError.message}`)
    }

    return NextResponse.json({
      vendor_id: vendor.id,
      user_id: user.id,
      message: '出店者の登録が完了しました'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '予期せぬエラーが発生しました',
        details: error
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, vendor_name')
      .order('vendor_name')

    if (error) throw error

    return NextResponse.json(vendors || [])
  } catch (error) {
    console.error('出店者一覧の取得に失敗しました:', error)
    return NextResponse.json(
      { error: '出店者情報の取得に失敗しました' },
      { status: 500 }
    )
  }
} 