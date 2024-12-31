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
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination"

// Mock data for user purchases
const mockPurchases = [
  { 
    id: 'ORD001', 
    date: '2023-06-01', 
    totalAmount: 5500,
    status: '配送済み',
    items: [
      { name: 'マルチビタミン', quantity: 2, price: 2000 },
      { name: 'プロテインパウダー', quantity: 1, price: 1500 }
    ]
  },
  { 
    id: 'ORD002', 
    date: '2023-05-15', 
    totalAmount: 3000,
    status: '処理中',
    items: [
      { name: 'オメガ3サプリメント', quantity: 1, price: 3000 }
    ]
  },
  { 
    id: 'ORD003', 
    date: '2023-04-20', 
    totalAmount: 7800,
    status: '配送済み',
    items: [
      { name: 'ビタミンC', quantity: 3, price: 1500 },
      { name: '亜鉛サプリメント', quantity: 2, price: 1650 }
    ]
  },
  { 
    id: 'ORD004', 
    date: '2023-03-10', 
    totalAmount: 4500,
    status: 'キャンセル',
    items: [
      { name: 'プロテインバー', quantity: 5, price: 900 }
    ]
  },
  { 
    id: 'ORD005', 
    date: '2023-02-25', 
    totalAmount: 6200,
    status: '配送済み',
    items: [
      { name: 'マルチミネラル', quantity: 1, price: 2200 },
      { name: 'ビタミンD', quantity: 2, price: 2000 }
    ]
  },
]

export default function UserPurchases({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const [purchases, setPurchases] = useState(mockPurchases)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    // Simulate API call
    const fetchPurchases = async () => {
      try {
        // In a real application, you would fetch the purchase data here
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPurchases(mockPurchases)
        setLoading(false)
      } catch (err) {
        setError('購入履歴の取得に失敗しました。')
        setLoading(false)
      }
    }

    fetchPurchases()
  }, [params.userId])

  const sortedPurchases = [...purchases].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    if (a[key as keyof typeof a] < b[key as keyof typeof b]) {
      return direction === 'ascending' ? -1 : 1
    }
    if (a[key as keyof typeof a] > b[key as keyof typeof b]) {
      return direction === 'ascending' ? 1 : -1
    }
    return 0
  })

  const filteredPurchases = sortedPurchases.filter(purchase => 
    (filterStatus === 'all' || purchase.status === filterStatus) &&
    (purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     purchase.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const renderSortIcon = (columnName: string) => {
    if (sortConfig?.key === columnName) {
      return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
    }
    return null
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
      <h1 className="text-2xl font-bold mb-6">ユーザー購入履歴 - {params.userId}</h1>
      <Card>
        <CardHeader>
          <CardTitle>購入一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="注文IDまたは商品名で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ステータスで絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="配送済み">配送済み</SelectItem>
                  <SelectItem value="処理中">処理中</SelectItem>
                  <SelectItem value="キャンセル">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => requestSort('id')}>
                  注文ID {renderSortIcon('id')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('date')}>
                  日付 {renderSortIcon('date')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => requestSort('totalAmount')}>
                  金額 {renderSortIcon('totalAmount')}
                </TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>商品</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.id}</TableCell>
                  <TableCell>{purchase.date}</TableCell>
                  <TableCell>{purchase.totalAmount.toLocaleString()}円</TableCell>
                  <TableCell>
                    <Badge variant={
                      purchase.status === '配送済み' ? 'default' :
                      purchase.status === '処理中' ? 'secondary' :
                      'destructive'
                    }>
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ul>
                      {purchase.items.map((item, index) => (
                        <li key={index}>{item.name} x {item.quantity}</li>
                      ))}
                    </ul>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink 
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push(`/users/${params.userId}`)}>
          ユーザー詳細に戻る
        </Button>
      </div>
    </div>
  )
}

