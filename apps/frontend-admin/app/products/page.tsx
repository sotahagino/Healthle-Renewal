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
import { PlusCircle, Eye, Pencil } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  vendor_id: string
  name: string
  description: string
  image_url: string
  category: string
  price: number
  status: string
  purchase_limit: number
  questionnaire_required: boolean
  created_at: string
  updated_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/admin/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || '商品情報の取得に失敗しました')
        }

        const data = await res.json()
        setProducts(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
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

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品一覧</h1>
        <Button onClick={() => router.push('/products/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新規登録
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品名</TableHead>
              <TableHead>カテゴリー</TableHead>
              <TableHead>価格</TableHead>
              <TableHead>購入制限</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>アンケート必須</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category || '-'}</TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell>{product.purchase_limit || '制限なし'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      product.status === 'on_sale' 
                        ? 'success' 
                        : product.status === 'reserved' 
                          ? 'default' 
                          : 'secondary'
                    }
                  >
                    {product.status === 'on_sale' 
                      ? '販売中' 
                      : product.status === 'reserved' 
                        ? '予約中' 
                        : '非表示'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={product.questionnaire_required ? 'default' : 'secondary'}>
                    {product.questionnaire_required ? '必須' : '任意'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(product.created_at).toLocaleDateString('ja-JP')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

