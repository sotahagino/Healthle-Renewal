import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 店舗情報とvendor_usersを取得
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_users (
          id,
          user_id,
          role,
          status,
          created_at
        )
      `)
      .eq('id', params.id)
      .single()

    if (vendorError) {
      console.error('Vendor fetch error:', vendorError)
      return NextResponse.json(
        { error: '店舗情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!vendor) {
      return NextResponse.json(
        { error: '指定された店舗が見つかりません' },
        { status: 404 }
      )
    }

    // 2. auth.usersからユーザー情報を取得
    const userIds = vendor.vendor_users.map(vu => vu.user_id)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Auth users fetch error:', authError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 3. レスポンスの形式を整える
    const formattedVendor = {
      ...vendor,
      vendor_users: vendor.vendor_users.map(vu => {
        const authUser = authUsers.users.find(u => u.id === vu.user_id)
        return {
          ...vu,
          users: {
            email: authUser?.email || '不明なユーザー',
            created_at: authUser?.created_at || vu.created_at
          }
        }
      })
    }

    return NextResponse.json(formattedVendor)

  } catch (error) {
    console.error('Vendor fetch error:', error)
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    )
  }
} 