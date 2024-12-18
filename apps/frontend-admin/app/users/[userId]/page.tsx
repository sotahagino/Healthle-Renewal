'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mock data for a user
const mockUser = {
  id: 'USR001',
  name: '山田 太郎',
  email: 'yamada@example.com',
  phone: '090-1234-5678',
  address: '東京都渋谷区恵比寿1-1-1',
  lineId: 'U1234567890',
  lastLogin: '2023-06-01 10:30',
  registrationDate: '2023-01-15',
  status: 'アクティブ',
  purchaseHistory: [
    { id: 'ORD001', date: '2023-05-15', amount: 5500 },
    { id: 'ORD002', date: '2023-04-20', amount: 3000 },
    { id: 'ORD003', date: '2023-03-10', amount: 7800 },
  ],
  consultationHistory: [
    { id: 'CON001', date: '2023-05-20', topic: '商品について' },
    { id: 'CON002', date: '2023-04-25', topic: '返品について' },
  ]
}

export default function UserDetail({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const [user, setUser] = useState(mockUser)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)

  useEffect(() => {
    // Simulate API call
    const fetchUser = async () => {
      try {
        // In a real application, you would fetch the user data here
        await new Promise(resolve => setTimeout(resolve, 1000))
        setUser(mockUser)
        setLoading(false)
      } catch (err) {
        setError('ユーザー情報の取得に失敗しました。')
        setLoading(false)
      }
    }

    fetchUser()
  }, [params.userId])

  const handleSuspendUser = async () => {
    try {
      // Here you would typically call your API to suspend the user
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUser(prev => ({ ...prev, status: '利用停止' }))
      setShowSuspendDialog(false)
    } catch (err) {
      setError('ユーザーの利用停止に失敗しました。')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">読み込み中...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ユーザー詳細 - {user.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>ユーザーID:</strong> {user.id}</p>
            <p><strong>名前:</strong> {user.name}</p>
            <p><strong>メール:</strong> {user.email}</p>
            <p><strong>電話番号:</strong> {user.phone}</p>
            <p><strong>住所:</strong> {user.address}</p>
            <p><strong>LINE ID:</strong> {user.lineId}</p>
            <p><strong>最終ログイン:</strong> {user.lastLogin}</p>
            <p><strong>登録日:</strong> {user.registrationDate}</p>
            <div className="mt-2">
              <strong>ステータス:</strong>
              <Badge className="ml-2" variant={user.status === '利用停止' ? 'destructive' : 'default'}>
                {user.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>アクティビティ</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">購入履歴</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>注文ID</TableHead>
                  <TableHead>日付</TableHead>
                  <TableHead>金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.purchaseHistory.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.id}</TableCell>
                    <TableCell>{purchase.date}</TableCell>
                    <TableCell>{purchase.amount.toLocaleString()}円</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button className="mt-4" variant="outline" onClick={() => router.push(`/users/${user.id}/purchases`)}>
              購入履歴詳細
            </Button>

            <h3 className="text-lg font-semibold mb-2 mt-6">相談履歴</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>相談ID</TableHead>
                  <TableHead>日付</TableHead>
                  <TableHead>トピック</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.consultationHistory.map((consultation) => (
                  <TableRow key={consultation.id}>
                    <TableCell>{consultation.id}</TableCell>
                    <TableCell>{consultation.date}</TableCell>
                    <TableCell>{consultation.topic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button className="mt-4" variant="outline" onClick={() => router.push(`/users/${user.id}/consultations`)}>
              相談履歴詳細
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => router.push('/users')}>
          ユーザー一覧に戻る
        </Button>
        {user.status !== '利用停止' && (
          <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">利用停止</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ユーザーの利用を停止しますか？</DialogTitle>
                <DialogDescription>
                  この操作を行うと、ユーザーはサービスを利用できなくなります。この操作は取り消すことができます。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>キャンセル</Button>
                <Button variant="destructive" onClick={handleSuspendUser}>利用停止</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

