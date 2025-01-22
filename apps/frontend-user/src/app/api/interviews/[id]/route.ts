import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { matched_categories, is_child } = body
    
    const supabase = createRouteHandlerClient({ cookies })

    // 問診データを更新
    const { data: interviewData, error: updateError } = await supabase
      .from('medical_interviews')
      .update({
        matched_categories: matched_categories || [],
        is_child: is_child || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Medical interview update error:', {
        error: updateError,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json(
        { 
          error: '問診データの更新に失敗しました',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json(interviewData)

  } catch (error) {
    console.error('Interview update error:', error)
    return NextResponse.json(
      { 
        error: '問診データの更新に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
} 