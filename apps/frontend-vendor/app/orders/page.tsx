'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, FileText } from 'lucide-react'

// 仮のデータ。実際のアプリケーションではAPIから取得します。
const orders = [
  { id: "ORD001", date: "2023-06-15 10:30", product: "ビタミンC サプリメント", quantity: 2, status: "未出荷" },
  { id: "ORD002", date: "2023-06-14 15:45", product: "プロテインパウダー", quantity: 1, status: "出荷済み" },
  { id: "ORD003", date: "2023-06-14 09:20", product: "オメガ3 フィッシュオイル", quantity: 3, status: "未出荷" },
  { id: "ORD004", date: "2023-06-13 14:10", product: "マルチビタミン", quantity: 1, status: "出荷済み" },
  { id: "ORD005", date: "2023-06-13 11:55", product: "グルコサミン&コンドロイチン", quantity: 2, status: "キャンセル" },
  // ... 他の注文データ
]

export default function OrdersList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredOrders = orders.filter(order => 
    (order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.product.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || order.status === statusFilter)
  )

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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#333333] mb-6">注文一覧</h1>

        <div className="mb-6 flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="注文ID・商品名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ステータスで絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="未出荷">未出荷</SelectItem>
              <SelectItem value="出荷済み">出荷済み</SelectItem>
              <SelectItem value="キャンセル">キャンセル</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-md shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>注文ID</TableHead>
                <TableHead>購入日時</TableHead>
                <TableHead>購入商品</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

