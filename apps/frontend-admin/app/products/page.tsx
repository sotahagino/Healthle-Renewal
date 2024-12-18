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
import { Search, AlertCircle } from 'lucide-react'
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

// Mock data for products
const products = [
  { id: 1, name: "マルチビタミン", vendor: "健康堂薬局", stock: 100, price: 2500, status: "販売中", genre: "サプリメント" },
  { id: 2, name: "オーガニック青汁", vendor: "グリーンライフ", stock: 50, price: 3000, status: "販売中", genre: "健康食品" },
  { id: 3, name: "プロテインパウダー", vendor: "ウェルネスファーマ", stock: 200, price: 4500, status: "販売中", genre: "サプリメント" },
  { id: 4, name: "ハーブティー", vendor: "ナチュラルケア", stock: 150, price: 1800, status: "販売中", genre: "健康食品" },
  { id: 5, name: "コラーゲンサプリ", vendor: "メディカルプラス", stock: 80, price: 3500, status: "販売停止", genre: "サプリメント" },
]

// Mock data for vendors and genres
const vendors = ["健康堂薬局", "グリーンライフ", "ウェルネスファーマ", "ナチュラルケア", "メディカルプラス"]
const genres = ["サプリメント", "健康食品", "医薬品", "美容製品"]

export default function ProductList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (vendorFilter === 'all' || product.vendor === vendorFilter) &&
    (genreFilter === 'all' || product.genre === genreFilter)
  )

  const handleStatusChange = (productId: number, newStatus: string) => {
    // Here you would typically call your API to update the product status
    console.log(`Changing status of product ${productId} to ${newStatus}`)
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">商品一覧</h1>

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="商品名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="出店者で絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての出店者</SelectItem>
              {vendors.map(vendor => (
                <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="ジャンルで絞り込み" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのジャンル</SelectItem>
              {genres.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-md shadow overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品名</TableHead>
                <TableHead>出店者名</TableHead>
                <TableHead>在庫</TableHead>
                <TableHead>価格</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.vendor}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.price.toLocaleString()}円</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.status === '販売中' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        詳細
                      </Button>
                      {product.status === '販売中' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusChange(product.id, '販売停止')}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          販売停止
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(product.id, '販売中')}
                        >
                          販売再開
                        </Button>
                      )}
                    </div>
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

