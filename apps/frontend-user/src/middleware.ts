import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証が必要なパスのリスト
const protectedPaths = [
  '/mypage',
  '/consultations/new',
  '/consultations/history',
  '/settings'
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 現在のパスが保護されたパスかどうかをチェック
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // 保護されたパスの場合のみ認証チェックを行う
  if (isProtectedPath) {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    // セッションエラーまたはセッションがない場合
    if (error || !session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // セッションの有効期限をチェック
    const sessionExpiry = new Date(session.expires_at! * 1000)
    if (sessionExpiry < new Date()) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ログインページへのアクセス
  if (req.nextUrl.pathname === '/login') {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (session) {
      // リダイレクトパラメータがある場合はそこへ、なければホームへ
      const redirectTo = req.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }
  }

  return res
}

// 保護されたルートの設定
export const config = {
  matcher: [
    '/mypage/:path*',
    '/consultations/:path*',
    '/settings/:path*',
    '/login'
  ]
} 