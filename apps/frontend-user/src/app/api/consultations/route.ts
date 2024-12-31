import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // リクエストボディの取得
    const body = await req.json()
    console.log('Request body:', body)

    if (!body.user_id) {
      console.error('ユーザーIDが提供されていません')
      return Response.json({ error: 'ユーザーIDが必要です' }, { status: 400 })
    }

    // consultationsテーブルに保存
    const { data, error } = await supabase
      .from('consultations')
      .insert([
        {
          user_id: body.user_id,
          symptom_text: body.symptom_text,
          session_id: body.session_id || null
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('データベースエラー:', error)
      return Response.json({ 
        error: 'データベースエラーが発生しました',
        details: error.message 
      }, { status: 500 })
    }

    console.log('相談を保存しました:', data)
    
    return Response.json({
      consultation_id: data.id,
      user_id: data.user_id,
      symptom_text: data.symptom_text
    })
    
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return Response.json({ 
      error: '予期せぬエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 