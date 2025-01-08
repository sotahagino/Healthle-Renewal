import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const returnUrl = searchParams.get('return_url')
    
    // ベースURLのみを使用
    const baseCallbackUrl = process.env.LINE_CALLBACK_URL!.split('?')[0]
    
    // デバッグログを追加
    console.log('Callback Debug Info:', {
      code,
      returnUrl,
      requestUrl: request.url,
      baseCallbackUrl,
      originalCallbackUrl: process.env.LINE_CALLBACK_URL,
      fullParams: Object.fromEntries(searchParams.entries())
    })

    if (!code) {
      throw new Error('�証コードが提供されていません')
    }

    console.log('Getting LINE token with code:', code)
    console.log('Using base callback URL:', baseCallbackUrl)

    // LINEトークンの取得
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: baseCallbackUrl,
        client_id: process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }).toString(),
    })

    const tokenData = await tokenResponse.json()
    console.log('LINE token response:', tokenData)

    if (tokenData.error) {
      console.error('LINE token error:', tokenData)
      throw new Error(`LINE認証エラー: ${tokenData.error_description || tokenData.error}`)
    }

    if (!tokenData.id_token) {
      throw new Error('LINE IDトークンの取得に失敗しました')
    }

    // id_tokenの検証とデコード
    const [headerB64, payloadB64] = tokenData.id_token.split('.')
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
    
    // メールアドレスの必須チェック
    if (!payload.email) {
      throw new Error('メールアドレスが取得できませんでした。LINEアカウントにメールアドレスを登録してください。')
    }

    const line_user_id = payload.sub
    const email = payload.email
    const name = payload.name

    console.log('LINE user info:', { line_user_id, email, name })

    // 既存ユーザーの検索
    const { data: existingUser, error: existErr } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', line_user_id)
      .single()

    let user = null
    let session = null
    
    if (existingUser) {
      // 既存ユーザーの場合
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: existingUser.email,
        password: line_user_id
      })
      if (signInErr) throw signInErr
      user = data.user
      session = data.session

      // メールアドレスが変更されている場合は更新
      if (existingUser.email !== email) {
        const { error: updateErr } = await supabase
          .from('users')
          .update({
            email: email,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateErr) throw updateErr
      }
    } else {
      // 新規ユーザー作成
      console.log('Creating new user with:', { email, line_user_id })
      
      try {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email,
          password: line_user_id,
          options: {
            data: { 
              line_user_id,
              line_email: email
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
          }
        })
        
        if (signUpErr) {
          console.error('Auth user creation error:', signUpErr)
          throw signUpErr
        }
        
        if (!data.user) {
          throw new Error('ユーザーの作成に失敗しました')
        }
        
        user = data.user
        session = data.session
        console.log('Auth user created:', user)

        // usersテーブルに登録
        const { error: insertErr } = await supabase
          .from('users')
          .insert({
            id: user.id,
            line_user_id,
            email: email,
            name: name || email.split('@')[0],
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          })

        if (insertErr) {
          console.error('User profile creation error:', insertErr)
          throw insertErr
        }

        console.log('User profile created successfully')
      } catch (error) {
        console.error('User creation process failed:', error)
        throw error
      }
    }

    if (!session) {
      throw new Error('セッションの作成に失敗しました')
    }

    // セッションの確認
    console.log('Session created:', session)

    // リダイレクト先の決定
    const redirectPath = returnUrl || '/mypage'

    // セッションクッキーの設定とリダイレクト
    const domain = new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname
    const cookieOptions = {
      domain,
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }

    console.log('Setting session cookies:', {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      domain: cookieOptions.domain,
      path: cookieOptions.path
    })

    const headers = new Headers()
    headers.append('Set-Cookie', [
      `sb-access-token=${session.access_token}; Domain=${cookieOptions.domain}; Path=${cookieOptions.path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${cookieOptions.maxAge}`,
      `sb-refresh-token=${session.refresh_token}; Domain=${cookieOptions.domain}; Path=${cookieOptions.path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${cookieOptions.maxAge}`
    ].join(', '))

    return new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(headers.entries()),
        Location: new URL(redirectPath, process.env.NEXT_PUBLIC_SITE_URL).toString()
      }
    })

  } catch (error) {
    console.error('Error in callback route:', error)
    const errorMessage = encodeURIComponent(error instanceof Error ? error.message : '認証に失敗しました')
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${errorMessage}`
      }
    })
  }
}
