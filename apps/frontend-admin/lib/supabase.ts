import { createClient } from '@supabase/supabase-js'

// 一時的な型定義
type Database = any

// 環境変数のチェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Supabaseクライアントの作成
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      // ブラウザでのみセッションを保持
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
)

// 認証済みクライアントを取得する関数
export const getAuthenticatedClient = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null
  
  if (token) {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
  }
  
  return supabase
}

export default supabase 