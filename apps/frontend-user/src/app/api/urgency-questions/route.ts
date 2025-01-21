import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    console.log('Received category_id:', categoryId)

    if (!categoryId) {
      return NextResponse.json(
        { error: 'カテゴリーIDが必要です' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    console.log('Querying database with category_id:', categoryId)
    const { data: questions, error } = await supabase
      .from('urgency_questions')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order')

    if (error) {
      console.error('Questions fetch error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { error: '質問の取得に失敗しました', details: error.message },
        { status: 500 }
      )
    }

    console.log('Retrieved questions:', questions)
    return NextResponse.json(questions)

  } catch (error) {
    console.error('Error in GET /api/urgency-questions:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 