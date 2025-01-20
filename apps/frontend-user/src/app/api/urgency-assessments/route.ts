import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interview_id, category_id, matched_question_ids, urgency_level } = body

    if (!interview_id || !category_id || !Array.isArray(matched_question_ids) || !urgency_level) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // 推奨診療科を取得
    const { data: questions, error: questionsError } = await supabase
      .from('urgency_questions')
      .select('recommended_departments')
      .in('id', matched_question_ids)
      .not('recommended_departments', 'is', null)

    if (questionsError) {
      console.error('Questions fetch error:', questionsError)
      return NextResponse.json(
        { error: '推奨診療科の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 推奨診療科を配列にまとめる
    const recommendedDepartments = Array.from(
      new Set(
        questions
          .flatMap(q => q.recommended_departments || [])
      )
    )

    // 判定結果を保存
    const { data: assessment, error: assessmentError } = await supabase
      .from('urgency_assessments')
      .insert({
        interview_id,
        category_id,
        matched_question_ids,
        urgency_level,
        recommended_departments: recommendedDepartments,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (assessmentError) {
      console.error('Assessment creation error:', assessmentError)
      return NextResponse.json(
        { error: '緊急度判定結果の保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(assessment)

  } catch (error) {
    console.error('Error in POST /api/urgency-assessments:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
} 