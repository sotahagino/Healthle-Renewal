import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic';

// サービスロール用クライアント（認証不要の操作用）
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // リクエストボディの取得
    const { user_id } = await req.json()
    
    if (!user_id) {
      return NextResponse.json({ 
        error: 'ユーザーIDが必要です' 
      }, { status: 400 })
    }

    // 古いセッション情報を取得
    const { data: { session: oldSession } } = await supabase.auth.getSession()
    const oldUserId = oldSession?.user?.id

    if (!oldUserId) {
      return NextResponse.json({ 
        error: '古いセッション情報が見つかりません' 
      }, { status: 400 })
    }

    console.log('Starting user data migration:', {
      old_user_id: oldUserId,
      new_user_id: user_id,
      timestamp: new Date().toISOString()
    })

    // トランザクションの開始
    const { error: migrationError } = await serviceClient.rpc(
      'migrate_guest_user_data',
      {
        p_guest_user_id: oldUserId,
        p_new_user_id: user_id
      }
    )

    if (migrationError) {
      console.error('Migration failed:', migrationError)
      return NextResponse.json({ 
        error: 'ユーザーデータの移行に失敗しました',
        details: migrationError.message 
      }, { status: 500 })
    }

    console.log('Migration completed successfully:', {
      old_user_id: oldUserId,
      new_user_id: user_id,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: 'ユーザーデータを正常に移行しました'
    })
    
  } catch (error) {
    console.error('Unexpected error during migration:', error)
    return NextResponse.json({ 
      error: '予期せぬエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 