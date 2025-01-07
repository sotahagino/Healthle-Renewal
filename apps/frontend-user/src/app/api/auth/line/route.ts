import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')
    const returnUrl = searchParams.get('return_url')

    if (!state) {
      throw new Error('State parameter is required')
    }

    // LINE認証URLの構築
    const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
    lineAuthUrl.searchParams.append('response_type', 'code')
    lineAuthUrl.searchParams.append('client_id', process.env.LINE_CLIENT_ID!)
    lineAuthUrl.searchParams.append('redirect_uri', process.env.LINE_CALLBACK_URL!)
    lineAuthUrl.searchParams.append('state', state)
    lineAuthUrl.searchParams.append('scope', 'profile openid email')

    // return_urlがある場合は、コールバックURLにクエリパラメータとして追加
    if (returnUrl) {
      const callbackUrl = new URL(process.env.LINE_CALLBACK_URL!)
      callbackUrl.searchParams.append('return_url', returnUrl)
      lineAuthUrl.searchParams.set('redirect_uri', callbackUrl.toString())
    }

    // LINE認証ページにリダイレクト
    return NextResponse.redirect(lineAuthUrl.toString())

  } catch (error) {
    console.error('LINE auth error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
} 