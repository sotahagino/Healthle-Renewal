import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received request body:', body)
    
    const { symptom_text = '', matched_categories, is_child } = body
    
    if (!symptom_text) {
      return NextResponse.json(
        { error: '症状の説明が必要です' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // ログインユーザーの取得
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user)

    // 問診データを作成（初期状態）
    const insertData = {
      symptom_text,
      matched_categories: matched_categories || [],
      is_child: is_child || false,
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || null // ログインユーザーのIDを保存
    }
    console.log('Attempting to insert data:', insertData)

    const { data: interviewData, error: interviewError } = await supabase
      .from('medical_interviews')
      .insert(insertData)
      .select()
      .single()

    if (interviewError) {
      console.error('Medical interview creation error:', {
        error: interviewError,
        details: interviewError.details,
        hint: interviewError.hint,
        code: interviewError.code
      })
      return NextResponse.json(
        { 
          error: '問診の開始に失敗しました',
          details: interviewError.message,
          code: interviewError.code
        },
        { status: 500 }
      )
    }

    console.log('Successfully created interview:', interviewData)
    return NextResponse.json({ interview_id: interviewData.id })

  } catch (error) {
    console.error('Interview creation error:', error)
    return NextResponse.json(
      { 
        error: '問診の開始に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
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

    const supabase = createRouteHandlerClient({ cookies })

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