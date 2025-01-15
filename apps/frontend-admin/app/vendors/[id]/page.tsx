'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PlusCircle } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  phone: string
}

interface StaffMember {
  id: string
  role: string
  status: string
  created_at: string
  user: {
    id: string
    name: string
    email: string
    phone_number: string
  }
}

interface Pharmacist {
  id: string
  license_number: string
  verification_status: string
  created_at: string
  user: User
}

interface Vendor {
  id: string
  vendor_name: string
  status: string
  email: string
  phone: string
  postal_code: string
  prefecture: string
  city: string
  address_line1: string
  address_line2: string
  business_hours: string
  description: string
  created_at: string
  updated_at: string
  staff_members: StaffMember[]
  pharmacists: StaffMember[]
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

const formatBusinessHours = (businessHours: any) => {
  if (!businessHours) return '未設定';
  
  try {
    const hours = typeof businessHours === 'string' 
      ? JSON.parse(businessHours) 
      : businessHours;

    return (
      <div className="space-y-1">
        {DAYS_OF_WEEK.map(day => {
          const dayHours = hours[day.id];
          if (!dayHours) return null;

          return (
            <div key={day.id} className="flex items-center space-x-2">
              <span className="w-20">{day.label}:</span>
              {dayHours.isOpen ? (
                <span>{dayHours.openTime} 〜 {dayHours.closeTime}</span>
              ) : (
                <span className="text-gray-500">休業</span>
              )}
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    console.error('Error parsing business hours:', e);
    return '形式エラー';
  }
};

export default function VendorDetailPage() {
  const params = useParams()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      console.log('Fetching vendor details from:', `${baseUrl}/api/vendors/${id}`)

      const response = await fetch(`${baseUrl}/api/vendors/${id}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('API Error:', data)
        throw new Error(data.error || 'データの取得に失敗しました')
      }

      if (!data) {
        throw new Error('データが見つかりません')
      }

      console.log('Received vendor data:', data)
      setVendor(data)
    } catch (error) {
      console.error('Failed to fetch vendor:', error)
      setError(error instanceof Error ? error.message : 'データの取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: '営業中',
      inactive: '休業中',
      pending: '審査中'
    }
    
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {statusMap[status as keyof typeof statusMap] || status}
      </Badge>
    )
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

  if (error || !vendor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">{error || '出店者が見つかりません'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">出店者詳細</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/vendors'}
          >
            一覧に戻る
          </Button>
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = `/vendors/${vendor.id}/edit`}
          >
            編集
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{vendor.vendor_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">ステータス</h3>
              <div className="mt-1">{getStatusBadge(vendor.status)}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">メールアドレス</h3>
              <div className="mt-1">{vendor.email}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">電話番号</h3>
              <div className="mt-1">{vendor.phone}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">住所</h3>
              <div className="mt-1">{`〒${vendor.postal_code} ${vendor.address_line1} ${vendor.address_line2}`}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">営業時間</h3>
              <div className="mt-1">
                {formatBusinessHours(vendor.business_hours)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">登録日</h3>
              <div className="mt-1">{new Date(vendor.created_at).toLocaleDateString('ja-JP')}</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">説明</h3>
            <div className="mt-1 whitespace-pre-wrap">{vendor.description}</div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>スタッフ一覧</CardTitle>
            <Button
              variant="outline"
              onClick={() => window.location.href = `/vendors/${vendor.id}/staff/new`}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              スタッフを追加
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>役割</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendor.staff_members.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>{staff.user.name}</TableCell>
                    <TableCell>{staff.user.email}</TableCell>
                    <TableCell>{staff.user.phone_number}</TableCell>
                    <TableCell>
                      {staff.role === 'owner' ? '店舗オーナー' :
                       staff.role === 'staff' ? 'スタッフ' : staff.role}
                    </TableCell>
                    <TableCell>{getStatusBadge(staff.status)}</TableCell>
                    <TableCell>
                      {new Date(staff.created_at).toLocaleDateString('ja-JP')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>薬剤師一覧</CardTitle>
            <Button
              variant="outline"
              onClick={() => window.location.href = `/vendors/${vendor.id}/pharmacists/new`}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              薬剤師を追加
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendor.pharmacists.map((pharmacist) => (
                  <TableRow key={pharmacist.id}>
                    <TableCell>{pharmacist.user.name}</TableCell>
                    <TableCell>{pharmacist.user.email}</TableCell>
                    <TableCell>{pharmacist.user.phone_number}</TableCell>
                    <TableCell>{getStatusBadge(pharmacist.status)}</TableCell>
                    <TableCell>
                      {new Date(pharmacist.created_at).toLocaleDateString('ja-JP')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 