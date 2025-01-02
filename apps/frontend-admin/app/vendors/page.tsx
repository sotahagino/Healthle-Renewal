'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Vendor {
  id: string
  vendor_name: string
  status: string
  email: string
  phone: string
  postal_code: string
  address: string
  business_hours: string
  created_at: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/vendors`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'データの取得に失敗しました')
      }
      const data = await response.json()
      setVendors(data)
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
      setError('データの取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return <Badge className={statusStyles[status as keyof typeof statusStyles]}>{status}</Badge>
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
        <h1 className="text-2xl font-bold">出店者一覧</h1>
        <Button onClick={() => window.location.href = '/vendors/new'}>
          新規出店者登録
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>店舗名</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>住所</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                <TableCell>{vendor.email}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{`〒${vendor.postal_code} ${vendor.address}`}</TableCell>
                <TableCell>{new Date(vendor.created_at).toLocaleDateString('ja-JP')}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/vendors/${vendor.id}`}
                  >
                    詳細
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

