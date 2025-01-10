import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { interview_id, questions, answers } = await request.json()
    console.log('Received data:', { interview_id, questions, answers })

    if (!interview_id || !questions || !answers) {
      return NextResponse.json(
        { error: '必要なデータが不足しています' },
        { status: 400 }
      )
    }

    // 既存の問診データを取得
    const { data: existingData, error: fetchError } = await supabase
      .from('medical_interviews')
      .select('*')
      .eq('id', interview_id)
      .single()

    if (fetchError) {
      console.error('Medical interview fetch error:', fetchError)
      return NextResponse.json(
        { error: '問診データの取得に失敗しました' },
        { status: 500 }
      )
    }

    // 回答データを整形
    const updateData: any = {
      questions: questions,
      answers: answers,
      updated_at: new Date().toISOString()
    }

    // 個別の回答カラムにも保存
    questions.forEach((q: any, index: number) => {
      if (index < 10) { // 最大10問まで
        updateData[`question_${index + 1}`] = q.text
        updateData[`answer_${index + 1}`] = answers[index]
      }
    })

    // Dify APIを使用して回答を分析
    try {
      const messagePayload = {
        symptom: existingData.symptom_text,
        questions: questions.map((q: any, index: number) => ({
          question: q.text,
          answer: answers[index]
        }))
      }

      console.log('Sending to Dify API:', messagePayload)

      const difyResponse = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_ANSWER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: messagePayload,
          query: "以下の症状と質問への回答を分析して、適切なアドバイスを提供してください",
          response_mode: "blocking",
          user: interview_id
        })
      })

      const difyResponseText = await difyResponse.text()
      console.log('Dify API response:', difyResponseText)

      if (!difyResponse.ok) {
        console.error('Dify API error:', {
          status: difyResponse.status,
          statusText: difyResponse.statusText,
          response: difyResponseText
        })
        return NextResponse.json(
          { error: `回答の分析に失敗しました: ${difyResponseText}` },
          { status: 500 }
        )
      }

      let difyData
      try {
        difyData = JSON.parse(difyResponseText)
      } catch (parseError) {
        console.error('Failed to parse Dify response:', difyResponseText)
        return NextResponse.json(
          { error: '回答の分析結果が不正な形式です' },
          { status: 500 }
        )
      }

      // 問診データを更新
      updateData.ai_response_text = difyData.answer
      updateData.status = 'completed'

      const { data: updatedData, error: updateError } = await supabase
        .from('medical_interviews')
        .update(updateData)
        .eq('id', interview_id)
        .select()
        .single()

      if (updateError) {
        console.error('Medical interview update error:', updateError)
        return NextResponse.json(
          { error: '問診データの更新に失敗しました' },
          { status: 500 }
        )
      }

      return NextResponse.json({ interview_id: updatedData.id })

    } catch (error) {
      console.error('Dify API call error:', error)
      return NextResponse.json(
        { error: `回答の分析中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Answer processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '回答の処理に失敗しました' },
      { status: 500 }
    )
  }
} 