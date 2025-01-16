import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // URLからIDを取得
  const pathParts = request.nextUrl.pathname.split('/')
  const consultationId = pathParts[pathParts.length - 1]

  try {
    const [consultationResult, questionsResult] = await Promise.all([
      // 1. 相談内容を取得
      supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single(),

      // 2. 質問と回答を取得
      supabase
        .from('questions')
        .select(`
          id,
          question_text,
          question_type,
          questionnaire:questionnaires!inner(consultation_id),
          answer:question_answers(answer_value)
        `)
        .eq('questionnaire.consultation_id', consultationId)
    ])

    if (consultationResult.error) throw consultationResult.error
    if (questionsResult.error) throw questionsResult.error

    // 3. レスポンスの整形
    const formattedQuestions = questionsResult.data.map(q => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      answer_value: q.answer[0]?.answer_value
    }))

    return NextResponse.json({
      consultation: consultationResult.data,
      questions: formattedQuestions
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consultation data' },
      { status: 500 }
    )
  }
} 