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
    const returnTo = searchParams.get('returnTo')
    
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

    // リダイレクト先の決定
    const returnUrl = searchParams.get('return_url')
    const redirectPath = returnUrl || '/mypage'

    try {
      // セッショントークンをlocalStorageに保存するHTML
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>認証処理中...</title>
          </head>
          <body>
            <script>
              try {
                const session = ${JSON.stringify(signInData.session)};
                const projectRef = '${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]}';
                
                // セッション情報を保存
                localStorage.setItem(\`sb-\${projectRef}-auth-token\`, JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                  expires_at: Math.floor(Date.now() / 1000) + ${60 * 60 * 24 * 7},
                  expires_in: ${60 * 60 * 24 * 7},
                  token_type: 'bearer',
                  user: session.user
                }));

                // purchaseFlowの処理
                const purchaseFlow = localStorage.getItem('purchaseFlow');
                if (purchaseFlow) {
                  const purchaseFlowData = JSON.parse(purchaseFlow);
                  const { order_id, timestamp } = purchaseFlowData;
                  
                  // タイムスタンプの検証（24時間以内）
                  const isValid = timestamp && (Date.now() - timestamp) < 24 * 60 * 60 * 1000;
                  
                  if (!isValid) {
                    console.error('Purchase flow data has expired');
                    localStorage.removeItem('purchaseFlow');
                    window.location.replace('${redirectPath}');
                  } else if (!order_id) {
                    console.error('No order_id found in purchase flow');
                    localStorage.removeItem('purchaseFlow');
                    window.location.replace('${redirectPath}');
                  } else {
                    console.log('Updating user_id for order:', order_id);
                    
                    // ユーザーIDを更新
                    fetch('/api/orders/update-user', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${session.access_token}\`
                      },
                      body: JSON.stringify({
                        user_id: session.user.id,
                        order_id: order_id
                      })
                    })
                    .then(async response => {
                      const data = await response.json();
                      if (!response.ok) {
                        throw new Error(data.error || 'Update request failed');
                      }
                      return data;
                    })
                    .then(data => {
                      console.log('Update successful:', data);
                      localStorage.removeItem('purchaseFlow');

                      // consultationsテーブルの更新
                      fetch('/api/consultations/update-user', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': \`Bearer \${session.access_token}\`
                        },
                        body: JSON.stringify({
                          user_id: session.user.id
                        })
                      })
                      .then(async response => {
                        const data = await response.json();
                        if (!response.ok) {
                          console.error('Failed to update consultations:', data.error);
                        } else {
                          console.log('Consultations updated successfully');
                        }
                      })
                      .catch(error => {
                        console.error('Error updating consultations:', error);
                      })
                      .finally(() => {
                        // 最後にリダイレクト
                        window.location.replace('${redirectPath}');
                      });
                    })
                    .catch(error => {
                      console.error('Update failed:', error);
                      window.location.replace('${redirectPath}');
                    });
                  }
                } else {
                  // purchaseFlowがない場合は直接リダイレクト
                  window.location.replace('${redirectPath}');
                }
              } catch (error) {
                console.error('Error in callback script:', error);
                window.location.replace('/login?error=auth_failed');
              }
            </script>
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
              <p style="text-align: center;">認証処理中です。しばらくお待ちください...</p>
            </div>
          </body>
        </html>
      `;

      return new NextResponse(html, {
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (error) {
      console.error('Error in callback process:', error)
      return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
    }

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
