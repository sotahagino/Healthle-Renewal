import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select(`
        id,
        vendor_name,
        status,
        email,
        phone,
        postal_code,
        address,
        business_hours,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(vendors)
  } catch (error) {
    console.error('Database Error:', error)
    return NextResponse.json(
      { 
        error: 'データベースの接続に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
} 