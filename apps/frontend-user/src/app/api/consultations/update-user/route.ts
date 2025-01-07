import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

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

    console.log('Updating consultations for user:', {
      old_user_id: oldUserId,
      new_user_id: user_id
    })

    // consultationsテーブルの更新
    const { error: updateError } = await serviceClient
      .from('consultations')
      .update({ user_id: user_id })
      .eq('user_id', oldUserId)

    if (updateError) {
      console.error('Failed to update consultations:', updateError)
      return NextResponse.json({ 
        error: '相談履歴の更新に失敗しました',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('Successfully updated consultations')
    
    return NextResponse.json({
      success: true,
      message: '相談履歴を更新しました'
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: '予期せぬエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 