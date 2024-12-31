import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { consultation_id, ai_response_text, session_id } = await request.json()

    if (!consultation_id || !ai_response_text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const updateData: any = {
      ai_response_text,
      updated_at: new Date().toISOString()
    }

    if (session_id) {
      updateData.session_id = session_id
    }

    const { error } = await supabase
      .from('consultations')
      .update(updateData)
      .eq('id', consultation_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    )
  }
} 