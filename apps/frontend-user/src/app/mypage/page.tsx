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

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' }> = {
  pending: { label: '処理中', variant: 'secondary' },
  completed: { label: '完了', variant: 'success' },
  default: { label: '未定義', variant: 'default' },
}

export default function MyPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders/list')
        if (!response.ok) throw new Error('Failed to fetch orders')
        const data = await response.json()
        setOrders(data)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
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
                        <Badge variant={statusMap[order.status]?.variant || 'default'}>
                          {statusMap[order.status]?.label || order.status}
                        </Badge>
                        <span className="font-medium whitespace-nowrap">
                          ¥{order.total_amount.toLocaleString()}
                        </span>
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

