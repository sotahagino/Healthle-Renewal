"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/ui/icons'
import { Badge } from '@/components/ui/badge'

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  product_name: string
}

interface Consultation {
  id: string
  created_at: string
  status: string
  title: string
  last_message: string
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '処理中', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '支払い完了', className: 'bg-[#E8F5F1] text-[#4C9A84]' },
  cancelled: { label: 'キャンセル', className: 'bg-red-100 text-red-800' },
  completed: { label: '完了', className: 'bg-blue-100 text-blue-800' },
  default: { label: '未定義', className: 'bg-gray-100 text-gray-800' }
}

const consultationStatusMap: Record<string, { label: string; className: string }> = {
  ongoing: { label: '相談中', className: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '完了', className: 'bg-[#E8F5F1] text-[#4C9A84]' },
  default: { label: '未定義', className: 'bg-gray-100 text-gray-800' }
}

// 回答テキストを制限する関数を追加
const truncateText = (text: string, maxLength: number = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export default function MyPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        // 注文データの取得
        const ordersResponse = await fetch('/api/orders/list')
        console.log('Orders API Response:', ordersResponse)
        const ordersData = await ordersResponse.json()
        console.log('Orders Data:', ordersData)
        setOrders(ordersData)

        // 相談データの取得
        try {
          const consultationsResponse = await fetch('/api/consultations/list')
          if (consultationsResponse.ok) {
            const consultationsData = await consultationsResponse.json()
            setConsultations(consultationsData)
          }
        } catch (error) {
          console.error('Error fetching consultations:', error)
          setConsultations([])
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleResumeConsultation = (consultationId: string) => {
    router.push(`/result?interview_id=${consultationId}`)
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#4C9A84]">
                アカウント情報
              </CardTitle>
              <CardDescription>
                アカウントの基本情報を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-gray-500">メールアドレス</p>
                  <p className="text-base">{user?.email}</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full sm:w-auto text-[#4C9A84] border-[#4C9A84] hover:bg-[#4C9A84] hover:text-white"
                >
                  ログアウト
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#4C9A84]">
                相談履歴
              </CardTitle>
              <CardDescription>
                過去の相談履歴を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consultations.length === 0 ? (
                <div className="text-center py-12">
                  <Icons.inbox className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-500">相談履歴はありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1 mb-2 sm:mb-0 flex-1">
                        <h3 className="font-medium line-clamp-1">{consultation.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(consultation.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">{truncateText(consultation.last_message)}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 ml-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${consultationStatusMap[consultation.status]?.className || consultationStatusMap.default.className}`}>
                          {consultationStatusMap[consultation.status]?.label || consultation.status}
                        </span>
                        <Button
                          onClick={() => handleResumeConsultation(consultation.id)}
                          variant="outline"
                          size="sm"
                          className="text-[#4C9A84] border-[#4C9A84] hover:bg-[#4C9A84] hover:text-white whitespace-nowrap"
                        >
                          <Icons.messageSquare className="h-4 w-4 mr-1" />
                          詳細を見る
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#4C9A84]">
                購入履歴
              </CardTitle>
              <CardDescription>
                過去の購入履歴を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Icons.inbox className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-500">購入履歴はありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1 mb-2 sm:mb-0">
                        <h3 className="font-medium">{order.product_name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[order.status]?.className || statusMap.default.className}`}>
                          {statusMap[order.status]?.label || order.status}
                        </span>
                        <span className="font-medium whitespace-nowrap">
                          ¥{order.total_amount.toLocaleString()}
                        </span>
                        <Button
                          onClick={() => router.push(`/mypage/orders/${order.id}`)}
                          variant="outline"
                          size="sm"
                          className="text-[#4C9A84] border-[#4C9A84] hover:bg-[#4C9A84] hover:text-white"
                        >
                          <Icons.chevronRight className="h-4 w-4 mr-1" />
                          詳細を見る
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

