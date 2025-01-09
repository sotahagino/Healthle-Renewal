import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Provider } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // リダイレクトURLの取得
    const { searchParams } = new URL(request.url)
    const redirectTo = searchParams.get('redirectTo')

    // PKCE認証用のURLを生成
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'line' as Provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/line/callback`,
        queryParams: {
          prompt: 'consent',
          bot_prompt: 'normal',
          state: redirectTo ? encodeURIComponent(redirectTo) : ''
        },
        skipBrowserRedirect: true // 自動リダイレクトを無効化
      }
    })

    if (error) {
      console.error('Login initialization error:', error)
      throw error
    }

    if (!data.url) {
      throw new Error('認証URLの生成に失敗しました')
    }

    // PKCEパラメータをセッションに保存
    const response = NextResponse.redirect(data.url)
    response.cookies.set('pkce_state', data.url.split('state=')[1]?.split('&')[0] || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5 // 5分
    })

    return response

  } catch (error) {
    console.error('Login initialization error:', error)
    return NextResponse.redirect(
      new URL('/login?error=initialization_failed', request.url)
    )
  }
} 