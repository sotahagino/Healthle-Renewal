'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface Vendor {
  id: string
  vendor_name: string
  email: string
  phone: string
  status: string
  created_at: string
  vendor_users: Array<{
    user_id: string
    role: string
  }>
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch('/api/admin/vendors')
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || '店舗情報の取得に失敗しました')
        }

        setVendors(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">出店者一覧</h1>
        <Button onClick={() => router.push('/vendors/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新規登録
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>店舗名</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                <TableCell>{vendor.email}</TableCell>
                <TableCell>{vendor.phone || '-'}</TableCell>
                <TableCell>
                  <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'}>
                    {vendor.status === 'active' ? '有効' : '無効'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(vendor.created_at).toLocaleDateString('ja-JP')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/vendors/${vendor.id}`)}
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

