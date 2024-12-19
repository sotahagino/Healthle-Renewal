import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLineToken, verifyLineIdToken } from '@/lib/line-oauth' // LINE OAuth用カスタム関数

type LineTokenResponse = {
  id_token?: string;
  access_token?: string;
  // 必要に応じて他のフィールド
}

type LineIdTokenPayload = {
  sub: string; // line_user_id
  // 必要に応じて他のフィールド（exp, iatなど）
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // req.json()は非同期関数で、戻り値はunknown型になりやすいので型ガード
  const body = await req.json() as { code?: string }

  const { code } = body
  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 })
  }

  // 1. LINEトークン取得 & id_token検証
  const tokenData: LineTokenResponse = await getLineToken(code)
  if (!tokenData.id_token) {
    return NextResponse.json({ error: 'No id_token' }, { status: 400 })
  }

  const payload: LineIdTokenPayload = await verifyLineIdToken(tokenData.id_token)
  const line_user_id = payload.sub
  if (!line_user_id) {
    return NextResponse.json({ error: 'No line_user_id in token' }, { status: 400 })
  }

  const pseudoEmail = `line_${line_user_id}@line-auth.fake`
  const randomPassword = 'some-generated-password'

  // 2. ユーザー存在確認または作成
  const { data: { users: existing }, error: existErr } = await supabaseAdmin.auth.admin.listUsers()
  let user = existing.find(u => u.email === pseudoEmail)
  if (existErr) {
    return NextResponse.json({ error: existErr.message }, { status: 500 })
  }

  if (!user) {
    // 新規ユーザー作成
    const { data: newUser, error: newUserErr } = await supabaseAdmin.auth.admin.createUser({
      email: pseudoEmail,
      password: randomPassword,
      user_metadata: { line_user_id }
    })
    if (newUserErr) {
      return NextResponse.json({ error: newUserErr.message }, { status: 500 })
    }
    user = newUser.user
  }

  // 3. ログインしてアクセストークン取得
  const { data: signInData, error: signInErr } = await supabaseAdmin.auth.signInWithPassword({
    email: pseudoEmail,
    password: randomPassword
  })
  if (signInErr) {
    return NextResponse.json({ error: signInErr.message }, { status: 500 })
  }

  const access_token = signInData.session?.access_token
  if (!access_token) {
    return NextResponse.json({ error: 'No access token' }, { status: 500 })
  }

  // 4. tokenをフロントへ返却
  return NextResponse.json({ token: access_token })
}
