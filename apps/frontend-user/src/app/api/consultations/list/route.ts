import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: interviews, error } = await supabase
      .from('medical_interviews')
      .select(`
        id,
        created_at,
        status,
        symptom_text,
        ai_response_text,
        last_response_at
      `)
      .eq('user_id', user.id)
      .not('ai_response_text', 'is', null)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (error) throw error

    // フロントエンドの期待する形式に変換
    const consultations = interviews.map(interview => ({
      id: interview.id,
      created_at: interview.created_at,
      status: interview.status,
      title: interview.symptom_text || '症状の相談',
      last_message: interview.ai_response_text || '相談内容を確認中'
    }))

    return NextResponse.json(consultations)
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 