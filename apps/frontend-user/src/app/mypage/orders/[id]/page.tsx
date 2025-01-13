'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface OrderDetail {
  id: string
  order_id: string
  created_at: string
  status: string
  total_amount: number
  shipping_name: string
  shipping_address: string
  shipping_phone: string
  product_name: string
  customer_email: string
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '処理中', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '支払い完了', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'キャンセル', className: 'bg-red-100 text-red-800' },
  completed: { label: '完了', className: 'bg-blue-100 text-blue-800' },
  default: { label: '未定義', className: 'bg-gray-100 text-gray-800' }
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchOrderDetail = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`)
        if (!response.ok) throw new Error('注文情報の取得に失敗しました')
        const data = await response.json()
        setOrder(data)
      } catch (error) {
        console.error('Error fetching order detail:', error)
        setError(error instanceof Error ? error.message : '注文情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetail()
  }, [params.id, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin text-[#4C9A84]" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                {error || '注文情報が見つかりませんでした'}
              </div>
              <Button
                onClick={() => router.push('/mypage')}
                className="mt-4 w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
              >
                マイページに戻る
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-[#4C9A84]">
              注文詳細
            </CardTitle>
            <div className="text-sm text-gray-500">
              注文番号: {order.order_id}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 注文ステータス */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">ステータス</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[order.status]?.className || statusMap.default.className}`}>
                {statusMap[order.status]?.label || order.status}
              </span>
            </div>

            {/* 注文日時 */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-500">注文日時</span>
              <p>{new Date(order.created_at).toLocaleString('ja-JP')}</p>
            </div>

            {/* 商品情報 */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-500">商品</span>
              <p className="font-medium">{order.product_name}</p>
              <p className="text-lg font-bold text-[#4C9A84]">
                ¥{order.total_amount.toLocaleString()}
              </p>
            </div>

            {/* 配送先情報 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">配送先情報</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="font-medium">{order.shipping_name}</p>
                <p className="text-sm">{order.shipping_phone}</p>
                <p className="text-sm">{order.shipping_address}</p>
              </div>
            </div>

            {/* メールアドレス */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-500">メールアドレス</span>
              <p>{order.customer_email}</p>
            </div>

            <Button
              onClick={() => router.push('/mypage')}
              className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            >
              マイページに戻る
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 