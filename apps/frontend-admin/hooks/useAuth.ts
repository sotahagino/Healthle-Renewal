import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import supabase from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('admin_access_token')
        if (!token) {
          throw new Error('認証されていません')
        }

        // トークンを使用してユーザー情報を取得
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (error || !user) {
          throw error
        }

        // 管理者権限の確認
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (adminError || !adminData || adminData.role !== 'Admin') {
          throw new Error('管理者権限がありません')
        }

        setUser(user)
      } catch (error) {
        localStorage.removeItem('admin_access_token')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  return { user, loading }
} 