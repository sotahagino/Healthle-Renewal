import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, vendors(id, vendor_name)')
      .eq('id', params.id)
      .single()

    if (error) {
      throw error
    }

    if (!product) {
      return NextResponse.json(
        { error: '商品が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('商品詳細の取得に失敗しました:', error)
    return NextResponse.json(
      { error: '商品情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .update({
        vendor_id: body.vendor_id,
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        status: body.status,
        purchase_limit: body.purchase_limit,
        questionnaire_required: body.questionnaire_required,
        image_url: body.image_url,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('商品の更新に失敗しました:', error)
    return NextResponse.json(
      { error: '商品の更新に失敗しました' },
      { status: 500 }
    )
  }
} 