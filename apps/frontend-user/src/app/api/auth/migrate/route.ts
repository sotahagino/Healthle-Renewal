import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/dist/client/components/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { oldUserId, newUserId } = await request.json()

    if (!oldUserId || !newUserId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    // セッションの検証
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session || session.user.id !== newUserId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 古いユーザーが実際にゲストユーザーであることを確認
    const { data: oldUserData, error: oldUserError } = await supabase
      .from('users')
      .select('is_guest')
      .eq('id', oldUserId)
      .single()

    if (oldUserError || !oldUserData?.is_guest) {
      return NextResponse.json(
        { error: '無効なゲストユーザーIDです' },
        { status: 400 }
      )
    }

    // トランザクションでデータ移行を実行
    const { error: migrationError } = await supabase.rpc('migrate_guest_data', {
      old_user_id: oldUserId,
      new_user_id: newUserId,
      migration_timestamp: new Date().toISOString()
    })

    if (migrationError) {
      console.error('Data migration error:', migrationError)
      return NextResponse.json(
        { 
          error: 'データの移行に失敗しました',
          details: process.env.NODE_ENV === 'development' ? migrationError.message : undefined
        },
        { status: 500 }
      )
    }

    // 移行完了後の検証
    const { data: migratedData, error: verificationError } = await supabase
      .from('users')
      .select('id, is_guest')
      .eq('id', newUserId)
      .single()

    if (verificationError || !migratedData) {
      console.error('Migration verification failed:', verificationError)
      return NextResponse.json(
        { error: 'データ移行の検証に失敗しました' },
        { status: 500 }
      )
    }

    // 古いユーザーデータの無効化（完全な削除は行わない）
    const { error: deactivationError } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString(),
        migrated_to: newUserId
      })
      .eq('id', oldUserId)

    if (deactivationError) {
      console.error('User deactivation error:', deactivationError)
      // エラーは記録するが、処理は続行
    }

    return NextResponse.json({
      status: 'success',
      message: 'データの移行が完了しました',
      user: migratedData
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'データ移行処理に失敗しました',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
} 