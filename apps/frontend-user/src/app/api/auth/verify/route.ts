import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // セッションの取得と検証
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session verification failed:', sessionError)
      return NextResponse.json(
        { 
          error: 'セッションの検証に失敗しました',
          details: process.env.NODE_ENV === 'development' ? sessionError.message : undefined
        },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが存在しません' },
        { status: 401 }
      )
    }

    // アクセストークンの検証
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証ヘッダーが不正です' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    if (token !== session.access_token) {
      return NextResponse.json(
        { error: 'トークンが一致しません' },
        { status: 401 }
      )
    }

    // ユーザー情報の取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('User data fetch failed:', userError)
      return NextResponse.json(
        { 
          error: 'ユーザー情報の取得に失敗しました',
          details: process.env.NODE_ENV === 'development' ? userError.message : undefined
        },
        { status: 404 }
      )
    }

    // セッションの有効期限を確認
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      // セッションの更新を試みる
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession) {
        return NextResponse.json(
          { error: 'セッションの更新に失敗しました' },
          { status: 401 }
        )
      }
    }

    // レスポンスヘッダーの設定
    const headers = new Headers()
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')

    return NextResponse.json({
      status: 'authenticated',
      user: userData,
      session: {
        expires_at: session.expires_at,
        access_token: session.access_token
      }
    }, {
      headers,
      status: 200
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { 
        error: '認証の検証に失敗しました',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
} 