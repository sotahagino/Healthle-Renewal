'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Search } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Header } from "@/components/Header"

// Mock data for operation logs
const mockLogs = [
  { id: 'LOG001', timestamp: '2023-06-20 10:30:15', user: '管理者A', targetType: '商品', targetId: 'PROD123', action: '価格変更' },
  { id: 'LOG002', timestamp: '2023-06-20 11:45:30', user: '出店者B', targetType: '在庫', targetId: 'PROD456', action: '在庫追加' },
  { id: 'LOG003', timestamp: '2023-06-20 13:15:00', user: '管理者C', targetType: '出店者', targetId: 'VEND789', action: 'アカウント停止' },
  { id: 'LOG004', timestamp: '2023-06-21 09:30:45', user: '出店者D', targetType: '商品', targetId: 'PROD234', action: '新規追加' },
  { id: 'LOG005', timestamp: '2023-06-21 14:20:10', user: '管理者A', targetType: '注文', targetId: 'ORD567', action: 'ステータス変更' },
  { id: 'LOG006', timestamp: '2023-06-22 10:05:30', user: '出店者B', targetType: '商品', targetId: 'PROD789', action: '説明更新' },
  { id: 'LOG007', timestamp: '2023-06-22 11:50:20', user: '管理者C', targetType: 'ユーザー', targetId: 'USR012', action: 'アカウントロック解除' },
  { id: 'LOG008', timestamp: '2023-06-22 15:30:00', user: '出店者D', targetType: '在庫', targetId: 'PROD345', action: '在庫調整' },
  { id: 'LOG009', timestamp: '2023-06-23 08:45:15', user: '管理者A', targetType: '出店者', targetId: 'VEND234', action: '新規承認' },
  { id: 'LOG010', timestamp: '2023-06-23 13:10:40', user: '出店者B', targetType: '商品', targetId: 'PROD567', action: '販売停止' },
]

export default function OperationLogs() {
  const [logs, setLogs] = useState(mockLogs)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState('all')
  const itemsPerPage = 10

  useEffect(() => {
    // Simulate API call
    const fetchLogs = async () => {
      try {
        // In a real application, you would fetch the log data here
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLogs(mockLogs)
        setLoading(false)
      } catch (err) {
        setError('操作ログの取得に失敗しました。')
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => 
    (filterType === 'all' || log.targetType === filterType) &&
    (log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.action.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

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
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">操作ログ一覧</h1>
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ユーザー、対象ID、操作内容で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="対象タイプで絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="商品">商品</SelectItem>
              <SelectItem value="在庫">在庫</SelectItem>
              <SelectItem value="出店者">出店者</SelectItem>
              <SelectItem value="注文">注文</SelectItem>
              <SelectItem value="ユーザー">ユーザー</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-white rounded-md shadow overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>操作日時</TableHead>
                <TableHead>操作ユーザー</TableHead>
                <TableHead>対象タイプ</TableHead>
                <TableHead>対象ID</TableHead>
                <TableHead>操作内容</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.targetType}</Badge>
                  </TableCell>
                  <TableCell>{log.targetId}</TableCell>
                  <TableCell>{log.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
      </div>
    </div>
  )
}

