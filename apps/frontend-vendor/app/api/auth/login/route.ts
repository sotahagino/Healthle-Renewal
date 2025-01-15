// frontend-vendor/app/api/auth/login/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // vendor_staff_rolesテーブルからvendor_idとroleを取得
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('vendor_id, role, status')
      .eq('user_id', session?.user.id)
      .eq('status', 'active')
      .single()

    if (staffError) {
      console.error('Vendor user fetch error:', staffError)
      throw new Error('薬局スタッフ情報の取得に失敗しました')
    }

    if (!staffRole) {
      throw new Error('このユーザーは薬局スタッフとして登録されていません')
    }

    if (staffRole.status !== 'active') {
      throw new Error('このアカウントは現在無効です')
    }

    return NextResponse.json({
      access_token: session?.access_token,
      vendor_id: staffRole.vendor_id,
      role: staffRole.role
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ログインに失敗しました' },
      { status: 401 }
    )
  }
}