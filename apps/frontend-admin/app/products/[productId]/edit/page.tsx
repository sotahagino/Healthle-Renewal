'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Vendor {
  id: string
  vendor_name: string
}

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
  vendors: {
    id: string
    vendor_name: string
  }
}

export default function EditProductPage({
  params,
}: {
  params: { productId: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [formData, setFormData] = useState({
    vendor_id: '',
    name: '',
    description: '',
    category: '',
    price: '',
    status: 'hidden',
    purchase_limit: '',
    questionnaire_required: false,
    image_url: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 出店者一覧の取得
        const vendorsRes = await fetch('/api/admin/vendors')
        if (!vendorsRes.ok) {
          throw new Error('出店者情報の取得に失敗しました')
        }
        const vendorsData = await vendorsRes.json()
        setVendors(vendorsData)

        // 商品情報の取得
        const productRes = await fetch(`/api/admin/products/${params.productId}`)
        if (!productRes.ok) {
          throw new Error('商品情報の取得に失敗しました')
        }
        const productData: Product = await productRes.json()

        setFormData({
          vendor_id: productData.vendor_id,
          name: productData.name,
          description: productData.description || '',
          category: productData.category || '',
          price: productData.price.toString(),
          status: productData.status,
          purchase_limit: productData.purchase_limit?.toString() || '',
          questionnaire_required: productData.questionnaire_required,
          image_url: productData.image_url || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
      }
    }

    fetchData()
  }, [params.productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/products/${params.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          purchase_limit: formData.purchase_limit ? parseInt(formData.purchase_limit) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '商品の更新に失敗しました')
      }

      router.push('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">商品編集</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_id">出店者 *</Label>
              <Select
                value={formData.vendor_id}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, vendor_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="出店者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">商品名 *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">カテゴリー *</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">価格 *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hidden">非表示</SelectItem>
                  <SelectItem value="on_sale">販売中</SelectItem>
                  <SelectItem value="reserved">予約中</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>商品詳細</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">商品説明</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">商品画像URL</Label>
              <Input
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                type="url"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>販売設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_limit">購入制限（個）</Label>
              <Input
                id="purchase_limit"
                name="purchase_limit"
                type="number"
                value={formData.purchase_limit}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="questionnaire_required"
                checked={formData.questionnaire_required}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, questionnaire_required: checked }))
                }
              />
              <Label htmlFor="questionnaire_required">アンケート必須</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? '更新中...' : '更新する'}
          </Button>
        </div>
      </form>
    </div>
  )
} 