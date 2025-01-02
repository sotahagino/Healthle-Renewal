import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { error } = await supabase.from('vendors').select('id').limit(1)
    if (error) throw error
    
    return NextResponse.json({ status: 'healthy' })
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    )
  }
} 