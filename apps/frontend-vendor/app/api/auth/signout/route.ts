// frontend-vendor/app/api/auth/signout/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.signOut()

    return NextResponse.json(
      { message: 'ログアウトしました' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'ログアウトに失敗しました' },
      { status: 500 }
    )
  }
}