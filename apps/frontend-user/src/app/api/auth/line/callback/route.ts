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
      throw new Error('No code provided')
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
      throw new Error(`LINE token error: ${tokenData.error_description || tokenData.error}`)
    }

    if (!tokenData.id_token) {
      throw new Error('Failed to get LINE id_token')
    }

    // id_tokenの検証とデコード
    const [headerB64, payloadB64] = tokenData.id_token.split('.')
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
    
    const line_user_id = payload.sub
    const email = payload.email || `line_${line_user_id}@line-auth.fake`
    const name = payload.name

    console.log('LINE user info:', { line_user_id, email, name })

    // 既存ユーザーの検索
    const { data: existingUser, error: existErr } = await supabase
      .from('users')
      .select('*')
      .eq('line_user_id', line_user_id)
      .single()

    let user = null
    
    if (existingUser) {
      // 既存ユーザーの場合は直接サインイン
      console.log('Existing user found:', existingUser)
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: existingUser.email,
        password: `line_${line_user_id}`
      })
      if (signInErr) throw signInErr
      user = signInData.user
    } else {
      // 新規ユーザー作成
      console.log('Creating new user with:', { email, line_user_id })
      
      try {
        // まずAuthユーザーを作成
        const { data: newUser, error: newUserErr } = await supabase.auth.admin.createUser({
          email: email,
          password: `line_${line_user_id}`,
          user_metadata: { line_user_id, line_email: email },
          email_confirm: true
        })
        
        if (newUserErr) {
          console.error('Auth user creation error:', newUserErr)
          throw newUserErr
        }
        
        if (!newUser || !newUser.user) {
          throw new Error('Failed to create auth user')
        }
        
        user = newUser.user
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
          await supabase.auth.admin.deleteUser(user.id)
          throw insertErr
        }

        console.log('User profile created successfully')
      } catch (error) {
        console.error('User creation process failed:', error)
        throw error
      }
    }

    // セッション作成（新規・既存共通）
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: `line_${line_user_id}`
    })
    if (signInErr) throw signInErr

    // セッションの確認
    console.log('Session created:', signInData.session)

    // ゲストユーザーデータの移行
    const guestUser = searchParams.get('guest_user_id') || 
      (typeof window !== 'undefined' ? 
        JSON.parse(localStorage.getItem('healthle_guest_user') || '{}').id : 
        null)

    if (guestUser) {
      console.log('Migrating guest user data:', { guestUser, newUserId: user!.id })
      
      // トランザクションの開始
      const { error: trxErr } = await supabase.rpc('migrate_guest_user_data', {
        p_guest_user_id: guestUser,
        p_new_user_id: user!.id
      })
      
      if (trxErr) {
        console.error('Failed to migrate guest user data:', trxErr)
      } else {
        console.log('Guest user data migration completed')
      }
    }

    // リダイレクト先の決定
    const redirectPath = returnUrl || '/mypage'

    // セッションクッキーの設定とリダイレクト
    if (signInData.session) {
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
        accessToken: signInData.session.access_token,
        refreshToken: signInData.session.refresh_token,
        domain: cookieOptions.domain,
        path: cookieOptions.path
      })

      const headers = new Headers()
      headers.append('Set-Cookie', [
        `sb-access-token=${signInData.session.access_token}; Domain=${cookieOptions.domain}; Path=${cookieOptions.path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${cookieOptions.maxAge}`,
        `sb-refresh-token=${signInData.session.refresh_token}; Domain=${cookieOptions.domain}; Path=${cookieOptions.path}; HttpOnly; Secure; SameSite=Lax; Max-Age=${cookieOptions.maxAge}`
      ].join(', '))

      // セッションの設定を確認
      const { data: { session }, error: sessionErr } = await supabase.auth.setSession({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token
      })

      if (sessionErr) {
        console.error('Failed to set session:', sessionErr)
      } else {
        console.log('Session set successfully:', session)
      }
      
      return new Response(null, {
        status: 302,
        headers: {
          ...Object.fromEntries(headers.entries()),
          Location: new URL(redirectPath, process.env.NEXT_PUBLIC_SITE_URL).toString()
        }
      })
    }

    return Response.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_SITE_URL))

  } catch (error) {
    console.error('Error in callback route:', error)
    return new Response('Error in callback route', { status: 500 })
  }
}
