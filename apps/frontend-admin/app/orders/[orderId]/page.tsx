'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Mock data for an order
const mockOrder = {
  id: 'ORD001',
  userId: 'USR123',
  userName: '山田 太郎',
  userEmail: 'yamada@example.com',
  shippingAddress: '東京都渋谷区恵比寿1-1-1',
  status: '準備中',
  totalAmount: 5500,
  products: [
    { id: 'PROD1', name: 'マルチビタミン', quantity: 2, price: 2000, requiresApproval: false },
    { id: 'PROD2', name: '第3類医薬品A', quantity: 1, price: 1500, requiresApproval: true, approvalStatus: '承認済み' },
  ],
  createdAt: '2023-06-01T10:00:00Z',
}

const orderStatuses = ['準備中', '発送済み', '配送中', '完了', 'キャンセル']

export default function OrderDetail({ params }: { params: { orderId: string } }) {
  const router = useRouter()
  const [order, setOrder] = useState(mockOrder)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Simulate API call
    const fetchOrder = async () => {
      try {
        // In a real application, you would fetch the order data here
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOrder(mockOrder)
        setLoading(false)
      } catch (err) {
        setError('注文情報の取得に失敗しました。')
        setLoading(false)
      }
    }

    fetchOrder()
  }, [params.orderId])

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Here you would typically call your API to update the order status
      await new Promise(resolve => setTimeout(resolve, 1000))
      setOrder(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      setError('ステータスの更新に失敗しました。')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">注文詳細 - {order.id}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>名前:</strong> {order.userName}</p>
            <p><strong>メール:</strong> {order.userEmail}</p>
            <p><strong>配送先:</strong> {order.shippingAddress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>注文情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>注文日時:</strong> {new Date(order.createdAt).toLocaleString('ja-JP')}</p>
            <p><strong>合計金額:</strong> {order.totalAmount.toLocaleString()}円</p>
            <div className="mt-2">
              <strong>ステータス:</strong>
              <Badge className="ml-2" variant={order.status === 'キャンセル' ? 'destructive' : 'default'}>
                {order.status}
              </Badge>
            </div>
            <div className="mt-4">
              <Select onValueChange={handleStatusChange} defaultValue={order.status}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ステータス変更" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>購入商品</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品名</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>価格</TableHead>
                <TableHead>小計</TableHead>
                <TableHead>承認状況</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{product.price.toLocaleString()}円</TableCell>
                  <TableCell>{(product.price * product.quantity).toLocaleString()}円</TableCell>
                  <TableCell>
                    {product.requiresApproval ? (
                      <Badge variant={product.approvalStatus === '承認済み' ? 'default' : 'secondary'}>
                        {product.approvalStatus === '承認済み' ? (
                          <><CheckCircle className="mr-1 h-4 w-4" /> 承認済み</>
                        ) : (
                          <><AlertCircle className="mr-1 h-4 w-4" /> 承認待ち</>
                        )}
                      </Badge>
                    ) : '不要'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={() => router.push('/orders')}>
          注文一覧に戻る
        </Button>
      </div>
    </div>
  )
}

