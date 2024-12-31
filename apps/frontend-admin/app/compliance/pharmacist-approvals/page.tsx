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

// Mock data for pharmacist approvals
const mockApprovals = [
  { id: 'APR001', orderId: 'ORD123', productName: '第1類医薬品A', userName: '山田太郎', orderDate: '2023-06-15 10:30', status: '承認待ち' },
  { id: 'APR002', orderId: 'ORD124', productName: '第1類医薬品B', userName: '佐藤花子', orderDate: '2023-06-15 11:45', status: '承認待ち' },
  { id: 'APR003', orderId: 'ORD125', productName: '第1類医薬品C', userName: '鈴木一郎', orderDate: '2023-06-15 14:20', status: '承認待ち' },
  { id: 'APR004', orderId: 'ORD126', productName: '第1類医薬品A', userName: '高橋美咲', orderDate: '2023-06-16 09:10', status: '承認待ち' },
  { id: 'APR005', orderId: 'ORD127', productName: '第1類医薬品D', userName: '田中健太', orderDate: '2023-06-16 13:55', status: '承認待ち' },
]

export default function PharmacistApprovals() {
  const [approvals, setApprovals] = useState(mockApprovals)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    // Simulate API call
    const fetchApprovals = async () => {
      try {
        // In a real application, you would fetch the approval data here
        await new Promise(resolve => setTimeout(resolve, 1000))
        setApprovals(mockApprovals)
        setLoading(false)
      } catch (err) {
        setError('承認待ちリストの取得に失敗しました。')
        setLoading(false)
      }
    }

    fetchApprovals()
  }, [])

  const filteredApprovals = approvals.filter(approval => 
    approval.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.userName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedApprovals = filteredApprovals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredApprovals.length / itemsPerPage)

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
      <h1 className="text-2xl font-bold mb-6">薬剤師承認待ち一覧</h1>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="注文ID、商品名、購入者名で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>承認ID</TableHead>
              <TableHead>注文ID</TableHead>
              <TableHead>商品名</TableHead>
              <TableHead>購入者</TableHead>
              <TableHead>注文日時</TableHead>
              <TableHead>ステータス</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApprovals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell className="font-medium">{approval.id}</TableCell>
                <TableCell>{approval.orderId}</TableCell>
                <TableCell>{approval.productName}</TableCell>
                <TableCell>{approval.userName}</TableCell>
                <TableCell>{approval.orderDate}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{approval.status}</Badge>
                </TableCell>
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
  )
}

