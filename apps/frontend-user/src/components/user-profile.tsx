'use client'

import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/auth-context'
import { AuthUser } from '@/types/auth'

interface UserProfileProps {
  user: AuthUser
}

export function UserProfile({ user }: UserProfileProps) {
  const router = useRouter()
  const { logout } = useAuthContext()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
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
      
      {/* ログアウトボタン */}
      <div className="mt-8 text-center">
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
        >
          ログアウト
        </button>
      </div>
    </div>
  )
} 