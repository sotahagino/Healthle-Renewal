"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/auth-provider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'

export default function MyPage() {
  const router = useRouter()
  const { user, loading, isAuthenticated, refreshUserData, logout } = useAuthContext()

  useEffect(() => {
    const initializePage = async () => {
      if (!loading && !isAuthenticated) {
        router.push('/login')
        return
      }

      if (isAuthenticated) {
        await refreshUserData()
      }
    }

    initializePage()
  }, [loading, isAuthenticated, router, refreshUserData])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

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
                  <dt className="text-gray-600">名前</dt>
                  <dd>{user.name || '未設定'}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">電話番号</dt>
                  <dd>{user.phone_number || '未設定'}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">住所</dt>
                  <dd>
                    {user.postal_code && user.prefecture && user.city && user.address_line
                      ? `〒${user.postal_code} ${user.prefecture}${user.city}${user.address_line}`
                      : '未設定'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">生年月日</dt>
                  <dd>{user.birthdate || '未設定'}</dd>
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

