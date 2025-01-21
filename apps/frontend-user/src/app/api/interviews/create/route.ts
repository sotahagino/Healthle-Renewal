import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request: Request) {
  try {
    const { user_id, consultation_text, questions } = await request.json()

    if (!user_id || !consultation_text) {
      return NextResponse.json(
        { error: 'ユーザーIDと相談内容は必須です' },
        { status: 400 }
      )
    }

    // 相談情報を保存
    const { data: interview, error: interviewError } = await supabase
      .from('medical_interviews')
      .insert({
        user_id,
        consultation_text,
        questions_and_answers: questions
      })
      .select()
      .single()

    if (interviewError) {
      console.error('Interview creation error:', interviewError)
      return NextResponse.json(
        { error: '相談情報の保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: interview.id })
  } catch (error) {
    console.error('Interview creation error:', error)
    return NextResponse.json(
      { error: '相談情報の保存に失敗しました' },
      { status: 500 }
    )
  }
} 