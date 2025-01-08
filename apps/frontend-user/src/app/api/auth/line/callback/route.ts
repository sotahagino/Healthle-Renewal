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
    if (returnUrl?.includes('purchase-complete')) {
      const guestUserId = searchParams.get('guest_user_id')
      if (guestUserId) {
        console.log('Migrating guest user data:', { guestUserId, newUserId: user!.id })
        
        // vendor_ordersの更新
        const { error: orderErr } = await supabase
          .from('vendor_orders')
          .update({ user_id: user!.id })
          .eq('user_id', guestUserId)
        
        if (orderErr) {
          console.error('Failed to update vendor_orders:', orderErr)
        }

        // consultationsの更新
        const { error: consultErr } = await supabase
          .from('consultations')
          .update({ user_id: user!.id })
          .eq('user_id', guestUserId)
        
        if (consultErr) {
          console.error('Failed to update consultations:', consultErr)
        }

        // ゲストユーザーの移行状態を更新
        const { error: guestErr } = await supabase
          .from('users')
          .update({ 
            migrated_to: user!.id,
            migrated_at: new Date().toISOString(),
            migration_status: 'migrated'
          })
          .eq('id', guestUserId)
        
        if (guestErr) {
          console.error('Failed to update guest user status:', guestErr)
        }
      }
    }

    // リダイレクト先の決定
    const redirectPath = returnUrl || '/mypage'

    // セッションクッキーの設定とリダイレクト
    const response = Response.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_SITE_URL))
    if (signInData.session) {
      const { data: { session } } = await supabase.auth.setSession(signInData.session)
      if (session) {
        response.headers.set('Set-Cookie', `sb-access-token=${session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`)
        response.headers.set('Set-Cookie', `sb-refresh-token=${session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`)
      }
    }

    return response

  } catch (error) {
    console.error('Error in callback route:', error)
    return new Response('Error in callback route', { status: 500 })
  }
}
