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
    const state = searchParams.get('state')
    const order_id = searchParams.get('order_id')

    console.log('Received parameters:', { code, state, order_id });

    if (!code) {
      console.error('Authorization code not found')
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
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
    let redirectPath = '/mypage'
    
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
    const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: `line_${line_user_id}`
    });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw sessionError;
    }

    console.log('Session created successfully:', session);

    // ユーザーIDの更新処理
    if (order_id && user) {
      try {
        // 注文の存在確認
        const { data: existingOrder, error: checkError } = await supabase
          .from('vendor_orders')
          .select('*')
          .eq('order_id', order_id)
          .single();

        if (checkError) {
          console.error('Error checking order:', checkError);
          throw checkError;
        }

        if (!existingOrder) {
          console.error('Order not found:', order_id);
          throw new Error('Order not found');
        }

        // vendor_ordersテーブルのuser_idを更新
        const { data: updatedOrder, error: updateError } = await supabase
          .from('vendor_orders')
          .update({ 
            user_id: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', order_id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update user_id in vendor_orders:', {
            error: updateError,
            errorMessage: updateError?.message || 'Unknown error',
            details: updateError?.details || null,
            hint: updateError?.hint || null,
            order_id,
            user_id: user.id
          });
          throw updateError;
        }

        console.log('Successfully updated user_id in vendor_orders:', updatedOrder);
      } catch (error) {
        console.error('Error in order update process:', error);
      }
    }

    // セッショントークンをlocalStorageに保存するためのHTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            const session = ${JSON.stringify(session)};
            const projectRef = '${process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/(?:https:\/\/)?([^.]+)/)?.[1] ?? ''}';
            
            // セッション情報を保存
            localStorage.setItem(\`sb-\${projectRef}-auth-token\`, JSON.stringify({
              access_token: session.session.access_token,
              refresh_token: session.session.refresh_token,
              expires_at: Math.floor(Date.now() / 1000) + ${60 * 60 * 24 * 7},
              expires_in: ${60 * 60 * 24 * 7},
              token_type: 'bearer',
              user: session.user
            }));

            // リダイレクト先の決定
            const returnPath = '${state || '/mypage'}';
            window.location.href = returnPath;
          </script>
        </head>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
