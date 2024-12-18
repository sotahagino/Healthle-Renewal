'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// This would typically come from an API call
const mockProduct = {
  id: '1',
  name: 'プレミアムマルチビタミン',
  image: '/placeholder.svg',
  description: '毎日の健康をサポートする高品質なマルチビタミンサプリメントです。',
  price: 3500,
  stock: 100,
  status: '販売中',
  vendor: '健康堂薬局',
  medicalAttributes: ['第3類医薬品'],
  medicalCategory: '第1類医薬品',
  purchaseLimit: {
    quantity: 1,
    reason: '1回の購入につき1個までに制限されています。'
  },
}

export default function ProductDetail({ params }: { params: { productId: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState(mockProduct)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Simulate API call
    const fetchProduct = async () => {
      try {
        // In a real application, you would fetch the product data here
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProduct(mockProduct)
        setLoading(false)
      } catch (err) {
        setError('商品情報の取得に失敗しました。')
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.productId])

  const handleStatusChange = async () => {
    try {
      // Here you would typically call your API to update the product status
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProduct(prev => ({
        ...prev,
        status: prev.status === '販売中' ? '販売停止' : '販売中'
      }))
    } catch (err) {
      setError('ステータスの更新に失敗しました。')
    }
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
      <h1 className="text-2xl font-bold mb-6">商品詳細</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{product.name}</CardTitle>
          <Badge variant={product.status === '販売中' ? 'default' : 'destructive'}>
            {product.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <Image
                src={product.image}
                alt={product.name}
                width={300}
                height={300}
                className="rounded-lg object-cover"
              />
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <div>
                <h3 className="font-semibold">説明</h3>
                <p>{product.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">価格</h3>
                  <p>{product.price.toLocaleString()}円</p>
                </div>
                <div>
                  <h3 className="font-semibold">在庫</h3>
                  <p>{product.stock}個</p>
                </div>
                <div>
                  <h3 className="font-semibold">出店者</h3>
                  <p>{product.vendor}</p>
                </div>
                <div>
                  <h3 className="font-semibold">医薬品属性</h3>
                  <p>{product.medicalAttributes.join(', ') || 'なし'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">医薬品分類</h3>
                  <p>{product.medicalCategory}</p>
                </div>
                <div>
                  <h3 className="font-semibold">購入制限</h3>
                  <p>{product.purchaseLimit.quantity}個まで</p>
                  <p className="text-sm text-gray-500">{product.purchaseLimit.reason}</p>
                </div>
              </div>
            </div>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>
              管理者は原則として商品情報を直接編集できません。緊急時の操作のみ可能です。
            </AlertDescription>
          </Alert>
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>購入制限</AlertTitle>
            <AlertDescription>
              この商品は{product.purchaseLimit.quantity}個までの購入制限があります。{product.purchaseLimit.reason}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => router.push('/products')}>
              戻る
            </Button>
            <Button
              variant={product.status === '販売中' ? 'destructive' : 'default'}
              onClick={handleStatusChange}
            >
              {product.status === '販売中' ? '販売停止' : '販売再開'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

