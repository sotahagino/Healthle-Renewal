'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function NewPharmacistPage() {
  const params = useParams()
  const vendorId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    verification_status: 'pending'
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let license_image_url = ''

      // 画像のアップロード処理
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('vendorId', vendorId)

        const uploadResponse = await fetch(`/api/vendors/${vendorId}/upload-license`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || '画像のアップロードに失敗しました')
        }

        const { url } = await uploadResponse.json()
        license_image_url = url
      } else {
        throw new Error('ライセンス画像は必須です')
      }

      // スタッフ情報の登録
      const response = await fetch(`/api/vendors/${vendorId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'pharmacist',
          license_image_url
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || '薬剤師の追加に失敗しました')
      }

      window.location.href = `/vendors/${vendorId}`
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : '薬剤師の追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>薬剤師追加</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number">保険薬剤師コード</Label>
              <Input
                id="license_number"
                required
                placeholder="例: 134XXXXXXX"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_image">ライセンス画像</Label>
              <Input
                id="license_image"
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification_status">確認ステータス</Label>
              <Select
                value={formData.verification_status}
                onValueChange={(value) => setFormData({ ...formData, verification_status: value })}
              >
                <SelectTrigger id="verification_status" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">確認待ち</SelectItem>
                  <SelectItem value="verified">確認済み</SelectItem>
                  <SelectItem value="rejected">却下</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = `/vendors/${vendorId}`}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '追加中...' : '追加'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 