import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/dist/client/components/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { 
      interview_id, 
      category_id, 
      matched_question_ids, 
      urgency_level,
      recommended_departments 
    } = body

    // バリデーション
    if (!interview_id || interview_id === 'undefined') {
      return NextResponse.json(
        { error: 'interview_idが不正です' },
        { status: 400 }
      )
    }

    // UUIDの形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(interview_id)) {
      return NextResponse.json(
        { error: 'interview_idの形式が不正です' },
        { status: 400 }
      )
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'category_idは必須です' },
        { status: 400 }
      )
    }

    if (!Array.isArray(matched_question_ids)) {
      return NextResponse.json(
        { error: 'matched_question_idsは配列である必要があります' },
        { status: 400 }
      )
    }

    if (!urgency_level) {
      return NextResponse.json(
        { error: 'urgency_levelは必須です' },
        { status: 400 }
      )
    }

    // 判定結果を保存
    const { data: assessment, error: assessmentError } = await supabase
      .from('urgency_assessments')
      .insert({
        interview_id,
        category_id,
        matched_question_ids,
        urgency_level,
        recommended_departments: recommended_departments || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (assessmentError) {
      console.error('Assessment creation error:', assessmentError)
      return NextResponse.json(
        { 
          error: '緊急度判定結果の保存に失敗しました',
          details: assessmentError.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(assessment)

  } catch (error) {
    console.error('Error in POST /api/urgency-assessments:', error)
    return NextResponse.json(
      { 
        error: '予期せぬエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
} 