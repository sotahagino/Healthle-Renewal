'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface Vendor {
  id: string;
  vendor_name: string;
  status: string;
  email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  address_line1: string;
  address_line2: string;
  business_hours: BusinessHours;
  description: string;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: '月曜日' },
  { id: 'tuesday', label: '火曜日' },
  { id: 'wednesday', label: '水曜日' },
  { id: 'thursday', label: '木曜日' },
  { id: 'friday', label: '金曜日' },
  { id: 'saturday', label: '土曜日' },
  { id: 'sunday', label: '日曜日' },
] as const;

const DEFAULT_BUSINESS_HOURS: BusinessHours = DAYS_OF_WEEK.reduce((acc, day) => ({
  ...acc,
  [day.id]: {
    isOpen: true,
    openTime: '09:00',
    closeTime: '18:00',
  }
}), {} as BusinessHours);

const INITIAL_FORM_DATA: Vendor = {
  id: '',
  vendor_name: '',
  status: 'active',
  email: '',
  phone: '',
  postal_code: '',
  prefecture: '',
  address_line1: '',
  address_line2: '',
  business_hours: DEFAULT_BUSINESS_HOURS,
  description: '',
};

export default function VendorEditPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Vendor>(INITIAL_FORM_DATA)

  useEffect(() => {
    if (params.id) {
      fetchVendorDetail(params.id as string)
    }
  }, [params.id])

  const fetchVendorDetail = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/vendors/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'データの取得に失敗しました')
      }

      // business_hoursのデータ構造を確認して変換
      let normalizedBusinessHours = DEFAULT_BUSINESS_HOURS;
      if (data.business_hours) {
        try {
          const parsedHours = typeof data.business_hours === 'string' 
            ? JSON.parse(data.business_hours) 
            : data.business_hours;
            
          normalizedBusinessHours = DAYS_OF_WEEK.reduce((acc, day) => ({
            ...acc,
            [day.id]: {
              isOpen: parsedHours[day.id]?.isOpen ?? true,
              openTime: parsedHours[day.id]?.openTime ?? '09:00',
              closeTime: parsedHours[day.id]?.closeTime ?? '18:00',
            }
          }), {} as BusinessHours);
        } catch (e) {
          console.error('Error parsing business hours:', e);
        }
      }

      setFormData({
        id: data.id || '',
        vendor_name: data.vendor_name || '',
        status: data.status || 'active',
        email: data.email || '',
        phone: data.phone || '',
        postal_code: data.postal_code || '',
        prefecture: data.prefecture || '',
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        business_hours: normalizedBusinessHours,
        description: data.description || '',
      })
    } catch (error) {
      console.error('Failed to fetch vendor:', error)
      setError(error instanceof Error ? error.message : 'データの取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessHoursChange = (day: string, field: keyof BusinessHours[string], value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value
        }
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/vendors/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '更新に失敗しました')
      }

      router.push(`/vendors/${params.id}`)
    } catch (error) {
      console.error('Failed to update vendor:', error)
      setError(error instanceof Error ? error.message : '更新中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }))
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">出店者編集</h1>
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          戻る
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{formData.vendor_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vendor_name">店舗名</Label>
                <Input
                  id="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="active">営業中</SelectItem>
                    <SelectItem value="inactive">休業中</SelectItem>
                    <SelectItem value="pending">審査中</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
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

              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県</Label>
                <Input
                  id="prefecture"
                  value={formData.prefecture}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line1">住所1（市区町村・番地）</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line2">住所2（建物名など）</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>営業時間</Label>
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.id} className="flex items-center space-x-4">
                      <div className="w-24">
                        <Label>{day.label}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${day.id}-isOpen`}
                          checked={formData.business_hours[day.id].isOpen}
                          onCheckedChange={(checked) => 
                            handleBusinessHoursChange(day.id, 'isOpen', checked as boolean)
                          }
                        />
                        <Label htmlFor={`${day.id}-isOpen`}>営業</Label>
                      </div>
                      {formData.business_hours[day.id].isOpen && (
                        <>
                          <Input
                            type="time"
                            value={formData.business_hours[day.id].openTime}
                            onChange={(e) => 
                              handleBusinessHoursChange(day.id, 'openTime', e.target.value)
                            }
                            className="w-32"
                          />
                          <span>〜</span>
                          <Input
                            type="time"
                            value={formData.business_hours[day.id].closeTime}
                            onChange={(e) => 
                              handleBusinessHoursChange(day.id, 'closeTime', e.target.value)
                            }
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

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
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? '更新中...' : '更新する'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 