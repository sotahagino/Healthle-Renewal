"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { getSupabaseClient } from '@/lib/supabase'

export default function MyPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)
  const supabase = getSupabaseClient()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const fetchUserData = async (userId: string) => {
      try {
        console.log('Fetching user data for ID:', userId)
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
          return null
        }

        return userData
      } catch (error) {
        console.error('Error in fetchUserData:', error)
        return null
      }
    }

    const checkAuthAndRedirect = async () => {
      console.log('MyPage useEffect - Current state:', { user, loading, isInitialized })
      
      if (!loading) {
        console.log('MyPage - Loading complete, checking user:', user)
        
        if (!user) {
          // ユーザーが存在しない場合は少し待ってから再確認
          timeoutId = setTimeout(async () => {
            console.log('MyPage - Rechecking user after delay')
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              const userData = await fetchUserData(session.user.id)
              if (userData) {
                console.log('MyPage - User data fetched:', userData)
                setIsInitialized(true)
                return
              }
            }
            console.log('MyPage - Still no user, redirecting to login')
            router.push('/login')
          }, 1000)
          return
        }
        
        // ユーザーが存在する場合は初期化完了
        if (!isInitialized) {
          console.log('MyPage - Setting initialized with user:', user)
          setIsInitialized(true)
        }
      }
    }

    checkAuthAndRedirect()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [user, loading, router, isInitialized, supabase])

  // ローディング中は読み込み画面を表示
  if (loading || !isInitialized) {
    console.log('MyPage - Showing loading state:', { loading, isInitialized })
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#4C9A84]">読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ユーザーが存在しない場合は何も表示しない（リダイレクト処理は useEffect で行う）
  if (!user) {
    console.log('MyPage - No user, waiting for redirect')
    return null
  }

  // 認証済みユーザーの場合はマイページを表示
  console.log('MyPage - Rendering content for user:', user)
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <h1 className="text-2xl font-bold mb-4">マイページ</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <p className="text-lg">ようこそ {user.name || user.email || 'ゲスト'} さん</p>
            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-2">アカウント情報</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-gray-600">メールアドレス</dt>
                  <dd>{user.email || '未設定'}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">アカウントタイプ</dt>
                  <dd>{user.is_guest ? 'ゲストユーザー' : '正規ユーザー'}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">ユーザーID</dt>
                  <dd>{user.id || '未設定'}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">名前</dt>
                  <dd>{user.name || '未設定'}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">電話番号</dt>
                  <dd>{user.phone_number || '未設定'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {/* ログアウトボタン */}
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
          >
            ログアウト
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

