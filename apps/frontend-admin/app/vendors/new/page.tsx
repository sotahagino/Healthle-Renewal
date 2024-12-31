'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VendorFormData {
  vendor_name: string
  email: string
  phone: string
  postal_code: string
  address: string
  business_hours: string
  description: string
  owner_email: string
  owner_password: string
}

export default function NewVendorPage() {
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_name: '',
    email: '',
    phone: '',
    postal_code: '',
    address: '',
    business_hours: '',
    description: '',
    owner_email: '',
    owner_password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'active'
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '登録に失敗しました')
      }

      router.push('/vendors')
      router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>新規出店者登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 店舗基本情報 */}
              <div className="space-y-2">
                <Label htmlFor="vendor_name">店舗名 *</Label>
                <Input
                  id="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">店舗メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">郵便番号</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_hours">営業時間</Label>
                <Input
                  id="business_hours"
                  value={formData.business_hours}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">店舗説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* オーナー情報 */}
              <div className="space-y-2 md:col-span-2 pt-6 border-t">
                <h3 className="text-lg font-medium">オーナー情報</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_email">オーナーメールアドレス *</Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={formData.owner_email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_password">初期パスワード *</Label>
                <Input
                  id="owner_password"
                  type="password"
                  value={formData.owner_password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '登録中...' : '登録する'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

