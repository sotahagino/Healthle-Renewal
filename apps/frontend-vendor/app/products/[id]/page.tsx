'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, Pencil } from 'lucide-react'

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

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login')
      return
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/vendor/products/${params.id}`)
        
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || '商品情報の取得に失敗しました')
        }

        const data = await res.json()

        // 他の出店者の商品は表示しない
        if (data.vendor_id !== vendorId) {
          throw new Error('この商品の閲覧権限がありません')
        }

        setProduct(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
        console.error('Error fetching product:', err)
      } finally {
        setLoading(false)
      }
    }

    if (vendorId) {
      fetchProduct()
    }
  }, [isAuthenticated, vendorId, params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || '商品が見つかりません'}
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price)
  }

  return (
    <div className="container mx-auto py-10 px-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button onClick={() => router.push(`/products/${product.id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">商品名</h3>
                <p className="mt-1">{product.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">カテゴリー</h3>
                <p className="mt-1">{product.category || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">価格</h3>
                <p className="mt-1">{formatPrice(product.price)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ステータス</h3>
                <div className="mt-1">
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>商品詳細</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">商品説明</h3>
              <p className="mt-1 whitespace-pre-wrap">{product.description || '-'}</p>
            </div>
            {product.image_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">商品画像</h3>
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="mt-2 max-w-md rounded-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>販売設定</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">購入制限</h3>
                <p className="mt-1">{product.purchase_limit || '制限なし'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">アンケート</h3>
                <div className="mt-1">
                  <Badge variant={product.questionnaire_required ? 'default' : 'secondary'}>
                    {product.questionnaire_required ? '必須' : '任意'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 