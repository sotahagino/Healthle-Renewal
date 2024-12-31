import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(products || [])
  } catch (error) {
    console.error('商品一覧の取得に失敗しました:', error)
    return NextResponse.json(
      { error: '商品情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.vendor_id) {
      return NextResponse.json(
        { error: '出店者の選択は必須です' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        vendor_id: body.vendor_id,
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        status: body.status,
        purchase_limit: body.purchase_limit,
        questionnaire_required: body.questionnaire_required,
        image_url: body.image_url,
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('商品の登録に失敗しました:', error)
    return NextResponse.json(
      { error: '商品の登録に失敗しました' },
      { status: 500 }
    )
  }
} 