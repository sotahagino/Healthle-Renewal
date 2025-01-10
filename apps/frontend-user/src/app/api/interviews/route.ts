import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { symptom_text } = await request.json()
    
    if (!symptom_text) {
      return NextResponse.json(
        { error: '症状の説明が必要です' },
        { status: 400 }
      )
    }

    // 問診データを作成（初期状態）
    const { data: interviewData, error: interviewError } = await supabase
      .from('medical_interviews')
      .insert({
        symptom_text,
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (interviewError) {
      console.error('Medical interview creation error:', interviewError)
      return NextResponse.json(
        { error: '問診の開始に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ interview_id: interviewData.id })

  } catch (error) {
    console.error('Interview creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '問診の開始に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '問診IDが必要です' },
        { status: 400 }
      )
    }

    const { data: interviewData, error: interviewError } = await supabase
      .from('medical_interviews')
      .select('*')
      .eq('id', id)
      .single()

    if (interviewError) {
      console.error('Medical interview fetch error:', interviewError)
      return NextResponse.json(
        { error: '問診データの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(interviewData)

  } catch (error) {
    console.error('Interview fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '問診データの取得に失敗しました' },
      { status: 500 }
    )
  }
} 