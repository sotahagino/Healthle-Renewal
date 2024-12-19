import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLineToken, verifyLineIdToken } from '@/lib/line-oauth'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // デバッグ用：環境変数の確認
    console.log('Environment variables:', {
      clientId: process.env.LINE_CLIENT_ID,
      redirectUri: process.env.LINE_REDIRECT_URI,
      hasSecret: !!process.env.LINE_CLIENT_SECRET,
      code: req.nextUrl.searchParams.get('code')
    });

    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 })
    }

    try {
      const tokenData = await getLineToken(code)
      console.log('Token data:', tokenData) // トークンデータをログ出力

      if (!tokenData.id_token) {
        return NextResponse.json({ error: 'No id_token' }, { status: 400 })
      }

      const payload = await verifyLineIdToken(tokenData.id_token)
      console.log('Verified payload:', payload) // 検証済みペイロードをログ出力

      const line_user_id = payload.sub
      if (!line_user_id) {
        return NextResponse.json({ error: 'No line_user_id' }, { status: 400 })
      }

      const pseudoEmail = `line_${line_user_id}@line-auth.fake`
      const randomPassword = crypto.randomUUID()

      // ユーザー存在チェック
      const { data: { users: existing }, error: existErr } = await supabaseAdmin.auth.admin.listUsers()
      if (existErr) throw existErr

      let user = existing.find(u => u.email === pseudoEmail)
      let isNewUser = false

      if (!user) {
        const { data: newUser, error: newUserErr } = await supabaseAdmin.auth.admin.createUser({
          email: pseudoEmail,
          password: randomPassword,
          user_metadata: { line_user_id },
          email_confirm: true
        })
        if (newUserErr) throw newUserErr
        user = newUser.user
        isNewUser = true
      }

      if (isNewUser) {
        const { error: insertErr } = await supabaseAdmin
          .from('users')
          .insert({
            id: user!.id,
            line_user_id,
            name: payload.name,
            updated_at: new Date(),
            created_at: new Date()
          })

        if (insertErr) throw insertErr
      }

      const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
        email: pseudoEmail,
        password: randomPassword
      })
      if (signInErr) throw signInErr

      const access_token = signInData.session?.access_token
      if (!access_token) {
        return NextResponse.json({ error: 'No access token' }, { status: 500 })
      }

      // トークンを取得後、フロントエンドにリダイレクト
      const redirectUrl = new URL('/mypage', req.url)
      redirectUrl.searchParams.set('token', access_token)
      return NextResponse.redirect(redirectUrl)
    } catch (tokenError: any) {
      console.error('Token/verify error:', tokenError)
      return NextResponse.json({ 
        error: tokenError.message,
        details: tokenError
      }, { status: 500 })
    }

  } catch (e: any) {
    console.error('Top level error:', e)
    return NextResponse.json({ 
      error: e.message || 'Internal Error',
      stack: e.stack,
      details: e
    }, { status: 500 })
  }
}
