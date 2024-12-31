'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users } from 'lucide-react'

interface VendorUser {
  user_id: string
  role: string
  status: string
  created_at: string
  users: {
    email: string
    created_at: string
  }
}

interface Vendor {
  id: string
  vendor_name: string
  email: string
  phone: string
  postal_code: string
  address: string
  business_hours: string
  description: string
  status: string
  created_at: string
  vendor_users: VendorUser[]
}

export default function VendorDetailPage({
  params
}: {
  params: { id: string }
}) {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await fetch(`/api/admin/vendors/${params.id}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || '店舗情報の取得に失敗しました')
        }

        setVendor(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchVendor()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || '店舗情報が見つかりません'}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{vendor.vendor_name}</h1>
          <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'}>
            {vendor.status === 'active' ? '有効' : '無効'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">メールアドレス</h3>
              <p>{vendor.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">電話番号</h3>
              <p>{vendor.phone || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">住所</h3>
              <p>{vendor.postal_code && `〒${vendor.postal_code}`}</p>
              <p>{vendor.address || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">営業時間</h3>
              <p>{vendor.business_hours || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">店舗説明</h3>
              <p className="whitespace-pre-wrap">{vendor.description || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                スタッフ一覧
              </CardTitle>
              <Button
                size="sm"
                onClick={() => router.push(`/vendors/${vendor.id}/staff/new`)}
              >
                スタッフ追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendor.vendor_users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.users.email}</p>
                    <p className="text-sm text-gray-500">
                      登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge>{user.role}</Badge>
                    <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                      {user.status === 'active' ? '有効' : '無効'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 