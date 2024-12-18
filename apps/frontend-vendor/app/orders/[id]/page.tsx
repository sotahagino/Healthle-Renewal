'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Truck, Package, FileText } from 'lucide-react'

// 仮のデータ。実際のアプリケーションではAPIから取得します。
const orderData = {
  id: "ORD001",
  date: "2023-06-15 10:30",
  status: "未出荷",
  user: {
    name: "山田 太郎",
    address: "〒100-0001 東京都千代田区千代田1-1",
    phone: "03-1234-5678"
  },
  items: [
    { id: 1, name: "ビタミンC サプリメント", quantity: 2, price: 2500 },
    { id: 2, name: "プロテインパウダー", quantity: 1, price: 4800 }
  ],
  total: 9800,
  memo: ""
}

export default function OrderDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [order, setOrder] = useState(orderData)
  const [memo, setMemo] = useState(order.memo)

  const handleStatusChange = (newStatus: string) => {
    setOrder({ ...order, status: newStatus })
    // Here you would typically send an API request to update the order status
  }

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMemo(e.target.value)
    // Here you would typically send an API request to update the order memo
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '未出荷':
        return 'bg-yellow-100 text-yellow-800'
      case '出荷済み':
        return 'bg-green-100 text-green-800'
      case 'キャンセル':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-[#333333]">注文詳細: {order.id}</h1>
          <Button variant="outline" onClick={() => router.push('/orders')}>
            注文一覧に戻る
          </Button>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>注文情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">注文日時</p>
                  <p>{order.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ステータス</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>配送先情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">氏名:</span> {order.user.name}</p>
                <p><span className="font-medium">住所:</span> {order.user.address}</p>
                <p><span className="font-medium">電話番号:</span> {order.user.phone}</p>
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
                    <TableHead>小計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>¥{item.price.toLocaleString()}</TableCell>
                      <TableCell>¥{(item.quantity * item.price).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold">合計: ¥{order.total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ステータス変更</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={order.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="未出荷">未出荷</SelectItem>
                  <SelectItem value="出荷済み">出荷済み</SelectItem>
                  <SelectItem value="キャンセル">キャンセル</SelectItem>
                </SelectContent>
              </Select>
              {order.status === '未出荷' && (
                <Button className="mt-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white" onClick={() => handleStatusChange('出荷済み')}>
                  <Truck className="mr-2 h-4 w-4" />
                  出荷済みにする
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>メモ</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="注文に関するメモを入力してください"
                value={memo}
                onChange={handleMemoChange}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

