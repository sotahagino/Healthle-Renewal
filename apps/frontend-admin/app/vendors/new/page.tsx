'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewVendor() {
  const router = useRouter()
  const [vendor, setVendor] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!vendor.name || !vendor.email || !vendor.password) {
      setError('すべての項目を入力してください。')
      return
    }

    try {
      // Here you would typically call your API to create a new vendor
      // For now, we'll just simulate a successful creation
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/vendors')
    } catch (err) {
      setError('新規出店者の登録に失敗しました。')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">新規出店者登録</h1>
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
              <Label htmlFor="password">初期パスワード</Label>
              <Input
                id="password"
                type="password"
                value={vendor.password}
                onChange={(e) => setVendor({...vendor, password: e.target.value})}
                required
              />
            </div>
            {/* Role selection will be added in a future update */}
            <div className="space-y-2">
              <Label htmlFor="role">ロール</Label>
              <Input
                id="role"
                value="標準出店者"
                disabled
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.push('/vendors')}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
                登録
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

