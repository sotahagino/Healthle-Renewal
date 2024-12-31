import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// サービスロール用クライアント（認証不要の操作用）
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // リクエストデータの取得
    const { consultation_id, questions, answers } = await req.json()
    console.log('Received data:', { consultation_id, questions, answers })

    // トランザクション開始
    const { data: result, error: txError } = await serviceClient.rpc(
      'save_questionnaire',
      {
        p_consultation_id: consultation_id,
        p_questions: questions,
        p_answers: answers
      }
    )

    if (txError) {
      console.error('Transaction error:', txError)
      if (txError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: '既にこの相談に対する質問票が存在します' },
          { status: 409 }
        )
      }
      throw txError
    }

    return NextResponse.json({
      success: true,
      questionnaire_id: result.questionnaire_id
    })

  } catch (error) {
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    })
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : '質問票の保存中にエラーが発生しました'
      },
      { status: 500 }
    )
  }
} 