'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
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

export default function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { isAuthenticated, vendorId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
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

        if (data.vendor_id !== vendorId) {
          throw new Error('この商品の編集権限がありません')
        }

        setFormData({
          name: data.name,
          description: data.description || '',
          category: data.category || '',
          price: data.price.toString(),
          status: data.status,
          purchase_limit: data.purchase_limit?.toString() || '',
          questionnaire_required: data.questionnaire_required,
          image_url: data.image_url || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
      }
    }

    if (vendorId) {
      fetchProduct()
    }
  }, [isAuthenticated, vendorId, params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/vendor/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vendor_id: vendorId,
          price: parseInt(formData.price),
          purchase_limit: formData.purchase_limit ? parseInt(formData.purchase_limit) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '商品の更新に失敗しました')
      }

      router.push(`/products/${params.id}`)
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

