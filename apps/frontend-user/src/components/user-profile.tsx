'use client'

import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/auth-provider'
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">プロフィール情報</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">名前</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name || '未設定'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email || '未設定'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">電話番号</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.phone_number || '未設定'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">住所</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.postal_code && user.prefecture && user.city && user.address_line
                ? `〒${user.postal_code} ${user.prefecture}${user.city}${user.address_line}`
                : '未設定'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="text-center">
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