import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/dist/client/components/headers'

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // リクエストボディの取得
    const body = await req.json()
    console.log('Request body:', body)

    if (!body.symptom_text) {
      return Response.json({ 
        error: '相談内容を入力してください' 
      }, { status: 400 })
    }

    // consultationsテーブルに保存
    const { data, error } = await supabase
      .from('consultations')
      .insert([
        {
          user_id: body.user_id,
          symptom_text: body.symptom_text
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