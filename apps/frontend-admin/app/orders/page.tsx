'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Order {
  id: string
  order_id: string
  vendor_id: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  shipping_name: string
  shipping_address: string
  shipping_phone: string
  customer_email: string
  vendor_name: string
  user_name: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Current user ID:', session?.user?.id)
        console.log('Current user email:', session?.user?.email)

        const res = await fetch('/api/admin/orders', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || '注文情報の取得に失敗しました')
        }

        const data = await res.json()
        setOrders(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
        console.error('Error fetching orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">支払い済み</Badge>
      case '準備中':
        return <Badge variant="secondary">準備中</Badge>
      case '発送済み':
        return <Badge variant="secondary">発送済み</Badge>
      case 'キャンセル':
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
        return <Badge variant="secondary">決済完了</Badge>
      case 'failed':
        return <Badge variant="destructive">決済失敗</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }
    
    const orderDate = new Date(order.created_at)
    if (startDate && new Date(startDate) > orderDate) {
      return false
    }
    if (endDate && new Date(endDate) < orderDate) {
      return false
    }
    
    return true
  })

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">注文一覧</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">ステータス</Label>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="ステータスで絞り込み" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="pending">処理待ち</SelectItem>
              <SelectItem value="processing">処理中</SelectItem>
              <SelectItem value="shipped">発送済み</SelectItem>
              <SelectItem value="delivered">配達済み</SelectItem>
              <SelectItem value="cancelled">キャンセル</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">開始日</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">終了日</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>注文ID</TableHead>
              <TableHead>注文日時</TableHead>
              <TableHead>出店者</TableHead>
              <TableHead>購入者</TableHead>
              <TableHead>配送先</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>合計金額</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>決済状況</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.order_id}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleString('ja-JP')}</TableCell>
                <TableCell>{order.vendor_name}</TableCell>
                <TableCell>{order.user_name}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.shipping_address}
                  </div>
                </TableCell>
                <TableCell>{order.customer_email}</TableCell>
                <TableCell>{formatPrice(order.total_amount)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

