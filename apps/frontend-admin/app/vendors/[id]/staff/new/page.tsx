'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NewStaffPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    status: 'active'
  })

  const roles = [
    { value: 'staff', label: 'スタッフ' },
    { value: 'owner', label: 'オーナー' }
  ]

  const statuses = [
    { value: 'active', label: '有効' },
    { value: 'inactive', label: '無効' },
    { value: 'pending', label: '保留中' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const vendorId = params.id
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/vendors/${vendorId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'スタッフの追加に失敗しました')
      }

      window.location.href = `/vendors/${vendorId}`
    } catch (error) {
      console.error('Failed to add staff:', error)
      setError(error instanceof Error ? error.message : 'スタッフの追加中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>スタッフ追加</CardTitle>
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
              <Label htmlFor="role">役割</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="役割を選択" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {roles.map((role) => (
                    <SelectItem 
                      key={role.value} 
                      value={role.value}
                      className="hover:bg-gray-100"
                    >
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {statuses.map((status) => (
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
                className="hover:bg-gray-100"
              >
                キャンセル
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? '処理中...' : '追加'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 