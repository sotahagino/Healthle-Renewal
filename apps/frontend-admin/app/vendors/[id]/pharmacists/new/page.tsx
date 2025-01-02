'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewPharmacistPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [licenseError, setLicenseError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    verificationStatus: 'pending'
  })

  const verificationStatuses = [
    { value: 'pending', label: '確認待ち' },
    { value: 'verified', label: '確認済み' },
    { value: 'rejected', label: '却下' }
  ]

  const validateLicenseNumber = (number: string) => {
    // 保険機関コードの形式チェック
    const licensePattern = /^\d{2}4\d{7}$/
    if (!licensePattern.test(number)) {
      setLicenseError('保険機関コードは「都道府県番号(2桁)」+「4」+「保険薬局コード(7桁)」の10桁の数字で入力してください')
      return false
    }
    setLicenseError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // 保険機関コードのバリデーション
    if (!validateLicenseNumber(formData.licenseNumber)) {
      setIsLoading(false)
      return
    }

    try {
      const vendorId = params.id
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/vendors/${vendorId}/pharmacists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || '薬剤師の追加に失敗しました')
      }

      window.location.href = `/vendors/${vendorId}`
    } catch (error) {
      console.error('Failed to add pharmacist:', error)
      setError(error instanceof Error ? error.message : '薬剤師の追加中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">保険機関コード</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => {
                  setFormData({ ...formData, licenseNumber: e.target.value })
                  validateLicenseNumber(e.target.value)
                }}
                placeholder="例: 134XXXXXXX"
                required
              />
              {licenseError && (
                <div className="text-red-600 text-sm mt-1">{licenseError}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="verificationStatus">確認ステータス</Label>
              <Select
                value={formData.verificationStatus}
                onValueChange={(value) => setFormData({ ...formData, verificationStatus: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="確認ステータスを選択" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {verificationStatuses.map((status) => (
                    <SelectItem 
                      key={status.value} 
                      value={status.value}
                      className="hover:bg-gray-100"
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = `/vendors/${params.id}`}
              >
                キャンセル
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                {isLoading ? '処理中...' : '追加'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 