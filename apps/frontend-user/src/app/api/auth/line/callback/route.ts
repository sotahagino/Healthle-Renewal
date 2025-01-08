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
    
    if (!code) {
      throw new Error('No code provided')
    }

    console.log('Getting LINE token with code:', code)

    // LINEトークンの取得
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_CALLBACK_URL!,
        client_id: process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('LINE token data:', tokenData)

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
      email: user.email!,
      password: `line_${line_user_id}`
    })
    if (signInErr) throw signInErr

    // returnToパラメータを取得
    const returnTo = searchParams.get('returnTo')
    // 許可されたリダイレクト先かチェック（セキュリティ対策）
    const allowedPaths = ['/mypage', '/result', '/purchase-complete']
    const redirectPath = returnTo && allowedPaths.some(path => returnTo.startsWith(path))
      ? returnTo
      : '/mypage'

    // vendor_ordersテーブルのuser_idを更新
    try {
      const redirectUrl = new URL(redirectPath, request.url)

      // セッショントークンをlocalStorageに保存し、vendor_ordersの更新を行うスクリプトを返す
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>認証処理中...</title>
          </head>
          <body>
            <script>
              (async function() {
                try {
                  const session = ${JSON.stringify(signInData.session)};
                  const projectRef = '${process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/(?:https:\/\/)?([^.]+)/)?.[1] ?? ''}';
                  
                  // セッションデータの保存を確実に行う
                  const sessionData = {
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_at: Math.floor(Date.now() / 1000) + ${60 * 60 * 24 * 7},
                    expires_in: ${60 * 60 * 24 * 7},
                    token_type: 'bearer',
                    user: session.user,
                    provider_token: session.provider_token,
                    provider_refresh_token: session.provider_refresh_token
                  };

                  // セッションデータを保存
                  localStorage.setItem(\`sb-\${projectRef}-auth-token\`, JSON.stringify(sessionData));

                  // セッションの有効性を確認
                  const storedSession = localStorage.getItem(\`sb-\${projectRef}-auth-token\`);
                  if (!storedSession) {
                    console.error('Session storage failed');
                    window.location.href = '/login?error=session_storage_failed';
                    return;
                  }

                  // �ッションが正しく保存されたことを確認
                  try {
                    const parsedSession = JSON.parse(storedSession);
                    if (!parsedSession.access_token || !parsedSession.user) {
                      throw new Error('Invalid session data');
                    }
                  } catch (error) {
                    console.error('Session validation failed:', error);
                    window.location.href = '/login?error=session_validation_failed';
                    return;
                  }

                  // 購入フロー情報の更新
                  const purchaseFlow = localStorage.getItem('purchaseFlow');
                  if (purchaseFlow) {
                    try {
                      const { consultation_id } = JSON.parse(purchaseFlow);
                      await fetch('/api/orders/update-user', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          user_id: '${user.id}',
                          consultation_id
                        })
                      });
                      localStorage.removeItem('purchaseFlow');
                    } catch (error) {
                      console.error('Error processing purchase flow:', error);
                    }
                  }

                  // 最後にリダイレクト（少し遅延を入れてセッションの設定を確実にする）
                  setTimeout(() => {
                    window.location.href = '${redirectUrl}';
                  }, 500);
                } catch (error) {
                  console.error('Error during authentication process:', error);
                  window.location.href = '/login?error=auth_process_failed';
                }
              })();
            </script>
            <p>認証処理中...</p>
            <p>自動的にリダイレクトされない場合は<a href="${redirectUrl}">こちら</a>をクリックしてください。</p>
          </body>
        </html>
      `

      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      })

    } catch (error) {
      console.error('Error updating vendor_orders:', error)
      // エラーメッセージを含めてリダイレクト
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', 'update_failed')
      return NextResponse.redirect(errorUrl)
    }

  } catch (error) {
    console.error('Callback error:', error)
    const errorUrl = new URL('/login', request.url)
    errorUrl.searchParams.set('error', 'auth_failed')
    errorUrl.searchParams.set('message', (error as Error).message || '認証に失敗しました')
    return NextResponse.redirect(errorUrl)
  }
}
