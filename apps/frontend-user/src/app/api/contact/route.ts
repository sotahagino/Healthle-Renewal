import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// バリデーションスキーマ
const contactSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  phone: z.string().optional(),
  company: z.string().optional(),
  type: z.enum(['product', 'service', 'recruitment', 'other'], {
    required_error: 'お問い合わせ種別を選択してください',
  }),
  message: z.string().min(1, 'お問い合わせ内容を入力してください'),
})

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // バリデーション
    const validatedData = contactSchema.parse(body)
    
    // Supabaseにデータを保存
    const { error } = await supabase
      .from('contacts')
      .insert([
        {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          company: validatedData.company,
          type: validatedData.type,
          message: validatedData.message,
          status: 'pending',
        },
      ])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'データの保存に失敗しました' },
        { status: 500 }
      )
    }

    // TODO: 自動返信メールの送信処理を追加

    return NextResponse.json(
      { message: 'お問い合わせを受け付けました' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Server error:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
} 