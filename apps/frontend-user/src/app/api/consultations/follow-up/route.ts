import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/dist/client/components/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/(?:https:\/\/)?([^.]+)/)?.[1]
    const authToken = await cookieStore.get(`sb-${projectRef}-auth-token`)?.value

    let userId = null
    if (authToken) {
      try {
        const parsedToken = JSON.parse(authToken)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', parsedToken.user.email)
          .single()

        if (!userError && userData) {
          userId = userData.id
        }
      } catch (error) {
        console.error('Error parsing auth token:', error)
      }
    }

    const { consultation_id, question, answer, session_id } = await request.json()

    if (!consultation_id || !question || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // follow_up_conversationsに追加
    const { error: followUpError } = await supabase
      .from('follow_up_conversations')
      .insert({
        consultation_id,
        question,
        answer,
        user_id: userId,
        created_at: new Date().toISOString()
      })

    if (followUpError) throw followUpError

    // session_idが提供された場合、consultationsテーブルを更新
    if (session_id) {
      const { error: updateError } = await supabase
        .from('consultations')
        .update({
          session_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultation_id)

      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save follow-up response' },
      { status: 500 }
    )
  }
} 