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
  user: User
  users?: User
}

interface Pharmacist {
  id: string
  license_number: string
  verification_status: string
  created_at: string
  user: {
    name: string
    email: string
    phone: string
  }
}

interface Vendor {
  id: string
  vendor_name: string
  status: string
  email: string
  phone: string
  postal_code: string
  address: string
  business_hours: string
  description: string
  created_at: string
  updated_at: string
  staff_members: StaffMember[]
  pharmacists: Pharmacist[]
}

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
              <div className="mt-1">{`〒${vendor.postal_code} ${vendor.address}`}</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">営業時間</h3>
              <div className="mt-1">{vendor.business_hours}</div>
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
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>スタッフ一覧</CardTitle>
              <Button
                onClick={() => window.location.href = `/vendors/${vendor.id}/staff/new`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                スタッフを追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>役割</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendor.staff_members.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>{(staff.users || staff.user)?.name}</TableCell>
                    <TableCell>{(staff.users || staff.user)?.email}</TableCell>
                    <TableCell>{(staff.users || staff.user)?.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {staff.role === 'staff' ? 'スタッフ' : '管理者'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        staff.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {staff.status === 'active' ? '有効' : '無効'}
                      </Badge>
                    </TableCell>
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
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>薬剤師一覧</CardTitle>
              <Button
                onClick={() => window.location.href = `/vendors/${vendor.id}/pharmacists/new`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                薬剤師を追加
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>免許番号</TableHead>
                  <TableHead>認証状態</TableHead>
                  <TableHead>登録日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendor.pharmacists.map((pharmacist) => (
                  <TableRow key={pharmacist.id}>
                    <TableCell>{pharmacist.user.name}</TableCell>
                    <TableCell>{pharmacist.user.email}</TableCell>
                    <TableCell>{pharmacist.user.phone}</TableCell>
                    <TableCell>{pharmacist.license_number}</TableCell>
                    <TableCell>
                      <Badge className={
                        pharmacist.verification_status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : pharmacist.verification_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }>
                        {pharmacist.verification_status === 'verified' ? '認証済み'
                          : pharmacist.verification_status === 'pending' ? '審査中'
                          : '未認証'}
                      </Badge>
                    </TableCell>
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