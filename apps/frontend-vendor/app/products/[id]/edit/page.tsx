'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, DollarSign, Package, AlertTriangle } from 'lucide-react'

// Mock product data (in a real app, this would be fetched from an API)
const mockProduct = {
  id: 1,
  name: "ビタミンC サプリメント",
  image: "/placeholder.svg",
  description: "高品質なビタミンCサプリメント。毎日の健康維持にお役立てください。",
  category: "otc",
  effects: "ビタミンC補給、抗酸化作用",
  dosage: "1日1回1錠を水またはぬるま湯で服用してください。",
  stock: 100,
  price: 2500,
  status: "active",
  isFirstClass: false,
  questionnaire: null,
  maxPurchase: null
}

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState(mockProduct)
  const [isFirstClass, setIsFirstClass] = useState(product.isFirstClass)

  useEffect(() => {
    // In a real app, fetch the product data here
    // For now, we're using the mock data
    setProduct(mockProduct)
    setIsFirstClass(mockProduct.isFirstClass)
  }, [params.id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the updated product data to your API
    console.log('Product updated', product)
    router.push('/products')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setProduct({ ...product, [e.target.id]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#333333] mb-6">商品編集: {product.name}</h1>
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">商品名</Label>
                <Input id="name" value={product.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">商品画像</Label>
                <div className="flex items-center space-x-4">
                  <Image src={product.image} alt={product.name} width={100} height={100} className="rounded-md" />
                  <div className="flex-1">
                    <Input id="image" type="file" accept="image/*" />
                  </div>
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">商品説明</Label>
                <Textarea id="description" value={product.description} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">医薬品種別</Label>
                <Select value={product.category} onValueChange={(value) => setProduct({ ...product, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="種別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">第1類医薬品</SelectItem>
                    <SelectItem value="second">第2類医薬品</SelectItem>
                    <SelectItem value="third">第3類医薬品</SelectItem>
                    <SelectItem value="otc">一般用医薬品</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="effects">効能・効果</Label>
                <Textarea id="effects" value={product.effects} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">用法・用量</Label>
                <Textarea id="dosage" value={product.dosage} onChange={handleInputChange} required />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>在庫・価格情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock">在庫数</Label>
                <Input id="stock" type="number" min="0" value={product.stock} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">価格 (円)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="price" type="number" min="0" className="pl-8" value={product.price} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>販売ステータス</Label>
                <RadioGroup value={product.status} onValueChange={(value) => setProduct({ ...product, status: value })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="active" />
                    <Label htmlFor="active">販売中</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="preorder" id="preorder" />
                    <Label htmlFor="preorder">予約</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hidden" id="hidden" />
                    <Label htmlFor="hidden">非表示</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>第1類医薬品情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="isFirstClass" checked={isFirstClass} onCheckedChange={(checked) => {
                  setIsFirstClass(checked)
                  setProduct({ ...product, isFirstClass: checked })
                }} />
                <Label htmlFor="isFirstClass">第1類医薬品として登録</Label>
              </div>
              {isFirstClass && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="questionnaire">問診票</Label>
                    <Select value={product.questionnaire || ''} onValueChange={(value) => setProduct({ ...product, questionnaire: value })}>
                      <SelectTrigger id="questionnaire">
                        <SelectValue placeholder="問診票を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="q1">問診票1</SelectItem>
                        <SelectItem value="q2">問診票2</SelectItem>
                        <SelectItem value="q3">問診票3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPurchase">購入上限数</Label>
                    <Input 
                      id="maxPurchase" 
                      type="number" 
                      min="1" 
                      value={product.maxPurchase || ''} 
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.push('/products')}>
              キャンセル
            </Button>
            <Button type="submit" className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
              <Package className="mr-2 h-4 w-4" /> 変更を保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

