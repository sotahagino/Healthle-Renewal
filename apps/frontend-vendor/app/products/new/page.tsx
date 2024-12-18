'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewProduct() {
  const router = useRouter()
  const [isFirstClass, setIsFirstClass] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the form data to your API
    console.log('Form submitted')
    router.push('/products')
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#333333] mb-6">新規商品登録</h1>
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">商品名</Label>
                <Input id="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">商品画像</Label>
                <div className="flex items-center space-x-2">
                  <Input id="image" type="file" accept="image/*" className="flex-1" />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">商品説明</Label>
                <Textarea id="description" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">医薬品種別</Label>
                <Select required>
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
                <Textarea id="effects" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">用法・用量</Label>
                <Textarea id="dosage" required />
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
                <Input id="stock" type="number" min="0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">価格 (円)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="price" type="number" min="0" className="pl-8" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>販売ステータス</Label>
                <RadioGroup defaultValue="active">
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
                <Switch id="isFirstClass" checked={isFirstClass} onCheckedChange={setIsFirstClass} />
                <Label htmlFor="isFirstClass">第1類医薬品として登録</Label>
              </div>
              {isFirstClass && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="questionnaire">問診票</Label>
                    <Select required>
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
                    <Input id="maxPurchase" type="number" min="1" />
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
              <Package className="mr-2 h-4 w-4" /> 商品を登録
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

