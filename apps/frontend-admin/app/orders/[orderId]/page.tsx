'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  user_id: string
  vendor_id: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  vendor_name: string
  user_name: string
  user_email: string
  shipping_address: string
  items: OrderItem[]
}

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string }
}) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${params.orderId}`)
        
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || '注文情報の取得に失敗しました')
        }

        const data = await res.json()
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
        console.error('Error fetching order:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.orderId])

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${params.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'ステータスの更新に失敗しました')
      }

      const updatedOrder = await res.json()
      setOrder(updatedOrder)
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || '注文が見つかりません'}
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">処理待ち</Badge>
      case 'processing':
        return <Badge variant="secondary">処理中</Badge>
      case 'shipped':
        return <Badge variant="success">発送済み</Badge>
      case 'delivered':
        return <Badge>配達済み</Badge>
      case 'cancelled':
        return <Badge variant="destructive">キャンセル</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default">未決済</Badge>
      case 'completed':
        return <Badge variant="success">決済完了</Badge>
      case 'failed':
        return <Badge variant="destructive">決済失敗</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">注文詳細</h1>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>注文情報</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">注文ID</h3>
                <p className="mt-1">{order.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">注文日時</h3>
                <p className="mt-1">{new Date(order.created_at).toLocaleString('ja-JP')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">出店者</h3>
                <p className="mt-1">{order.vendor_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">合計金額</h3>
                <p className="mt-1">{formatPrice(order.total_amount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ステータス</h3>
                <div className="mt-1 flex items-center space-x-2">
                  {getStatusBadge(order.status)}
                  <Select
                    value={order.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-[180px] ml-2">
                      <SelectValue placeholder="ステータスを変更" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">処理待ち</SelectItem>
                      <SelectItem value="processing">処理中</SelectItem>
                      <SelectItem value="shipped">発送済み</SelectItem>
                      <SelectItem value="delivered">配達済み</SelectItem>
                      <SelectItem value="cancelled">キャンセル</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">決済状況</h3>
                <div className="mt-1">{getPaymentStatusBadge(order.payment_status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>購入者情報</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">購入者名</h3>
                <p className="mt-1">{order.user_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">メールアドレス</h3>
                <p className="mt-1">{order.user_email}</p>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500">配送先住所</h3>
                <p className="mt-1">{order.shipping_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>注文商品</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品名</TableHead>
                  <TableHead>数量</TableHead>
                  <TableHead>単価</TableHead>
                  <TableHead className="text-right">小計</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatPrice(item.price)}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    合計
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.total_amount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

