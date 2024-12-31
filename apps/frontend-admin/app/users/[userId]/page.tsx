'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from 'lucide-react'

interface User {
  id: string
  line_user_id: string
  name: string
  email: string
  address: string
  phone_number: string
  created_at: string
  updated_at: string
}

interface Activity {
  id: string
  type: 'purchase' | 'consultation'
  date: string
  details: string
  status: string
}

// 既存のアクティビティデータはそのまま使用
const activities: Activity[] = [
  // ... 既存のアクティビティデータ
]

export default function UserDetailPage({
  params,
}: {
  params: { userId: string }
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/admin/users/${params.userId}`)
        
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'ユーザー情報の取得に失敗しました')
        }

        const data = await res.json()
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
        console.error('Error fetching user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [params.userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'ユーザーが見つかりません'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">ユーザー詳細</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">名前</h3>
              <p className="mt-1">{user.name || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">メールアドレス</h3>
              <p className="mt-1">{user.email || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">電話番号</h3>
              <p className="mt-1">{user.phone_number || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">住所</h3>
              <p className="mt-1">{user.address || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">LINE ID</h3>
              <p className="mt-1">{user.line_user_id || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">登録日</h3>
              <p className="mt-1">{new Date(user.created_at).toLocaleString('ja-JP')}</p>
            </div>
          </CardContent>
        </Card>

        {/* アクティビティ（既存のコードをそのまま使用） */}
        <div className="space-y-6">
          {/* 既存のアクティビティ関連のコード */}
        </div>
      </div>
    </div>
  )
}

