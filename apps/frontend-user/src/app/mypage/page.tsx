"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'

export default function MyPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    console.log('MyPage useEffect - Current state:', { user, loading, isInitialized })
    
    // 初期化が完了し、かつloadingがfalseになった時のみリダイレクトを判断
    if (!loading && !isInitialized) {
      console.log('MyPage - Initialization complete, checking user:', user)
      setIsInitialized(true)
      if (!user || user.is_guest) {
        console.log('MyPage - Redirecting to login due to:', { user, loading })
        router.push('/login')
      }
    }
  }, [user, loading, router, isInitialized])

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

  // 未認証またはゲストユーザーの場合は何も表示しない
  if (!user || user.is_guest) {
    console.log('MyPage - User not authorized:', { user })
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
            <p className="text-lg">ようこそ {user.email || 'ゲスト'} さん</p>
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
      </main>
      <Footer />
    </div>
  )
}

