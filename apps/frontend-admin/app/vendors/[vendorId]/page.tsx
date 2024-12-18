'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// This would typically come from an API call
const mockVendor = {
  id: '1',
  name: '健康堂薬局',
  contactPerson: '山田 太郎',
  email: 'yamada@kenkodo.com',
  phone: '03-1234-5678',
  status: true,
  memo: '優良な出店者。迅速な対応が特徴。',
}

export default function VendorDetail({ params }: { params: { vendorId: string } }) {
  const router = useRouter()
  const [vendor, setVendor] = useState(mockVendor)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Here you would typically call your API to update the vendor
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/vendors')
    } catch (err) {
      setError('出店者情報の更新に失敗しました。')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">出店者詳細</h1>
      <Card>
        <CardHeader>
          <CardTitle>出店者情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">出店者名</Label>
              <Input
                id="name"
                value={vendor.name}
                onChange={(e) => setVendor({...vendor, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">担当者名</Label>
              <Input
                id="contactPerson"
                value={vendor.contactPerson}
                onChange={(e) => setVendor({...vendor, contactPerson: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={vendor.email}
                onChange={(e) => setVendor({...vendor, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={vendor.phone}
                onChange={(e) => setVendor({...vendor, phone: e.target.value})}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={vendor.status}
                onCheckedChange={(checked) => setVendor({...vendor, status: checked})}
              />
              <Label htmlFor="status">アカウント有効</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="memo">メモ（内部向け）</Label>
              <Textarea
                id="memo"
                value={vendor.memo}
                onChange={(e) => setVendor({...vendor, memo: e.target.value})}
                rows={4}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push('/vendors')}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
                保存
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Button variant="link" onClick={() => console.log('ログ参照')}>
          ログを参照
        </Button>
      </div>
    </div>
  )
}

