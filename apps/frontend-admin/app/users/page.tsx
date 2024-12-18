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
import { Search } from 'lucide-react'
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious
} from "@/components/ui/pagination"
import { Header } from "@/components/Header"

// Mock data for users
const users = [
  { id: 'USR001', name: '山田 太郎', email: 'yamada@example.com', lineId: 'U1234567890', lastLogin: '2023-06-01 10:30' },
  { id: 'USR002', name: '佐藤 花子', email: 'sato@example.com', lineId: 'U2345678901', lastLogin: '2023-06-02 15:45' },
  { id: 'USR003', name: '鈴木 一郎', email: 'suzuki@example.com', lineId: 'U3456789012', lastLogin: '2023-06-03 09:15' },
  { id: 'USR004', name: '田中 美咲', email: 'tanaka@example.com', lineId: 'U4567890123', lastLogin: '2023-06-04 14:20' },
  { id: 'USR005', name: '高橋 健太', email: 'takahashi@example.com', lineId: 'U5678901234', lastLogin: '2023-06-05 11:50' },
]

export default function UserList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = users.filter(user => 
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">ユーザー一覧</h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ユーザーID・名前で検索"
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
                <TableHead>ユーザーID</TableHead>
                <TableHead>名前</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>LINE ID</TableHead>
                <TableHead>最終ログイン</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.lineId}</TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/users/${user.id}`)}
                    >
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination className="mt-4">
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
  )
}

