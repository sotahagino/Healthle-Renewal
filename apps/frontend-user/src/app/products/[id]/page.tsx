'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  status: string
  stripe_payment_link_url: string
}

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handlePurchase = () => {
    if (product?.stripe_payment_link_url) {
      window.location.href = product.stripe_payment_link_url
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          商品情報の取得に失敗しました
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {product.image_url && (
              <div className="relative aspect-square">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              
              <div className="mb-4">
                <Badge variant={product.status === 'on_sale' ? 'default' : 'secondary'}>
                  {product.status === 'on_sale' ? '販売中' : '販売停止中'}
                </Badge>
              </div>

              <p className="text-gray-600 mb-4">{product.description}</p>

              <div className="text-2xl font-bold mb-6">
                ¥{product.price.toLocaleString()}
              </div>

              {product.status === 'on_sale' && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handlePurchase}
                >
                  今すぐ購入
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 