'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Pencil } from 'lucide-react'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ProductDetails {
  id: string
  vendor_id: string
  name: string
  description: string
  category: string
  price: number
  image_url: string
  status: string
  purchase_limit: number | null
  stock_quantity: number
  medicine_type: string
  ingredients: { content: string }
  effects: string
  usage_instructions: string
  precautions: string
  requires_questionnaire: boolean
  requires_pharmacist_consultation: boolean
  shipping_info: {
    delivery_time: string
    return_policy: string
    sale_start_date?: string
    sale_end_date?: string
    shipping_fee: string
    can_combine_shipping: boolean
  }
  created_at: string
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'cold': '風邪薬',
  'stomach': '胃腸薬',
  'painkiller': '痛み止め',
  'sleep_improvement': '睡眠改善薬',
  'other': 'その他'
}

export default function ProductDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()
  const [product, setProduct] = useState<ProductDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: staffRole, error: staffError } = await supabase
          .from('vendor_staff_roles')
          .select('vendor_id, role, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (staffError) throw staffError
        if (!staffRole) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .eq('vendor_id', staffRole.vendor_id)
          .single()

        if (error) throw error
        if (!data) throw new Error('商品が見つかりません')

        setProduct(data)
      } catch (err) {
        console.error('Error fetching product details:', err)
        setError('商品情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetails()
  }, [supabase, params.id, router])

  if (loading) {
    return <div>読み込み中...</div>
  }

  if (error || !product) {
    return <div>{error || '商品が見つかりません'}</div>
  }

  const handleEdit = () => {
    router.push(`/products/${params.id}/edit`)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">商品詳細</h1>
        </div>
        <Button onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          編集
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="medicine">医薬品情報</TabsTrigger>
          <TabsTrigger value="shipping">配送・取引情報</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.image_url && (
                <div className="mb-4">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">商品名</h3>
                  <p>{product.name}</p>
                </div>

                <div>
                  <h3 className="font-semibold">価格</h3>
                  <p>¥{product.price.toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="font-semibold">カテゴリー</h3>
                  <p>{CATEGORY_LABELS[product.category] || product.category}</p>
                </div>

                <div>
                  <h3 className="font-semibold">在庫数</h3>
                  <p>{product.stock_quantity}</p>
                </div>

                <div>
                  <h3 className="font-semibold">購入制限</h3>
                  <p>{product.purchase_limit || '制限なし'}</p>
                </div>

                <div>
                  <h3 className="font-semibold">ステータス</h3>
                  <p>{product.status === 'on_sale' ? '販売中' : product.status === 'hidden' ? '非表示' : '予約中'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">商品説明</h3>
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medicine">
          <Card>
            <CardHeader>
              <CardTitle>医薬品情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">医薬品区分</h3>
                <p>{product.medicine_type}</p>
              </div>

              <div>
                <h3 className="font-semibold">有効成分と含有量</h3>
                <p className="whitespace-pre-wrap">{product.ingredients.content}</p>
              </div>

              <div>
                <h3 className="font-semibold">効能・効果</h3>
                <p className="whitespace-pre-wrap">{product.effects}</p>
              </div>

              <div>
                <h3 className="font-semibold">用法・用量</h3>
                <p className="whitespace-pre-wrap">{product.usage_instructions}</p>
              </div>

              <div>
                <h3 className="font-semibold">使用上の注意</h3>
                <p className="whitespace-pre-wrap">{product.precautions}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">問診必須</h3>
                  <p>{product.requires_questionnaire ? 'あり' : 'なし'}</p>
                </div>

                <div>
                  <h3 className="font-semibold">薬剤師相談必須</h3>
                  <p>{product.requires_pharmacist_consultation ? 'あり' : 'なし'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>配送・取引情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">発送時期</h3>
                <p>{product.shipping_info.delivery_time}</p>
              </div>

              <div>
                <h3 className="font-semibold">返品・キャンセル条件</h3>
                <p className="whitespace-pre-wrap">{product.shipping_info.return_policy}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">販売開始日</h3>
                  <p>{product.shipping_info.sale_start_date || '設定なし'}</p>
                </div>

                <div>
                  <h3 className="font-semibold">販売終了日</h3>
                  <p>{product.shipping_info.sale_end_date || '設定なし'}</p>
                </div>

                <div>
                  <h3 className="font-semibold">送料</h3>
                  <p>¥{parseInt(product.shipping_info.shipping_fee).toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="font-semibold">同梱可否</h3>
                  <p>{product.shipping_info.can_combine_shipping ? '可能' : '不可'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 