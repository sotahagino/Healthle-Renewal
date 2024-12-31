import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { email, password, role } = await req.json()

    // 1. auth.usersにユーザーを作成
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (userError) {
      console.error('User creation error:', userError)
      throw new Error(`スタッフの登録に失敗しました: ${userError.message}`)
    }

    // 2. vendor_usersテーブルに紐付けを作成
    const { error: linkError } = await supabase
      .from('vendor_users')
      .insert([
        {
          vendor_id: params.id,
          user_id: user.id,
          role,
          status: 'active'
        }
      ])

    if (linkError) {
      // ロールバック: auth.usersから削除
      await supabase.auth.admin.deleteUser(user.id)
      console.error('Vendor-user link error:', linkError)
      throw new Error('スタッフと店舗の紐付けに失敗しました')
    }

    return NextResponse.json({
      message: 'スタッフを追加しました',
      user_id: user.id
    })

  } catch (error) {
    console.error('Staff creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
} 