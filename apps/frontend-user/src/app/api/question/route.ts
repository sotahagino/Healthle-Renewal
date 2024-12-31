import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { symptom_text, consultation_id } = await request.json()

    if (!symptom_text) {
      return NextResponse.json(
        { error: '相談内容が入力されていません' },
        { status: 400 }
      )
    }

    // Dify APIを使用して質問を生成
    const difyResponse = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/completion-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_QUESTION_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: { symptom: symptom_text },
        response_mode: "blocking",
        user: consultation_id
      })
    })

    if (!difyResponse.ok) {
      console.error('Dify API error:', await difyResponse.text())
      throw new Error('質問生成に失敗しまし���')
    }

    const difyData = await difyResponse.json()
    console.log('Dify API response:', difyData)

    // 質問データを整形
    let questions
    try {
      const cleanedAnswer = difyData.answer
        .replace(/```json\n|\n```/g, '')  // JSONブロックのマーカーを削除
        .replace(/\s+/g, ' ')             // 複数の空白を単一の空白に
        .trim()                           // 前後の空白を削除
      
      const parsedData = JSON.parse(cleanedAnswer)
      questions = parsedData.questions
      
      if (!Array.isArray(questions)) {
        throw new Error('質問データの形式が不正です')
      }
    } catch (error) {
      console.error('Failed to parse questions:', error)
      throw new Error('質問データの解析に失敗しました')
    }

    return NextResponse.json({ questions })

  } catch (error) {
    console.error('Question generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '質問票の生成に失敗しました' },
      { status: 500 }
    )
  }
} 