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

    // vendor_usersテーブルからvendor_idを取得
    const { data: vendorUser, error: vendorError } = await supabase
      .from('vendor_users')
      .select('vendor_id')
      .eq('user_id', session?.user.id)
      .single()

    if (vendorError) throw vendorError

    return NextResponse.json({
      access_token: session?.access_token,
      vendor_id: vendorUser.vendor_id
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 401 }
    )
  }
}