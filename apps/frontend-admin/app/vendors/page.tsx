'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Search, Plus } from 'lucide-react'
import { Header } from "@/components/Header"

// Mock data for vendors
const vendors = [
  { id: 1, name: "健康堂薬局", email: "info@kenkodo.com", status: "有効" },
  { id: 2, name: "グリーンライフ", email: "contact@greenlife.co.jp", status: "有効" },
  { id: 3, name: "ウェルネスファーマ", email: "support@wellnesspharma.jp", status: "停止" },
  { id: 4, name: "ナチュラルケア", email: "info@naturalcare.com", status: "有効" },
  { id: 5, name: "メディカルプラス", email: "contact@medicalplus.co.jp", status: "停止" },
]

export default function VendorList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || vendor.status === statusFilter)
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">出店者一覧</h1>
          <Button 
            onClick={() => router.push('/vendors/new')}
            className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> 新規出店者登録
          </Button>
        </div>

        <div className="mb-6 flex space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="出店者名で検索"
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
              <SelectItem value="有効">有効</SelectItem>
              <SelectItem value="停止">停止</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>出店者名</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vendor.status === '有効' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/vendors/${vendor.id}`)}
                    >
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

