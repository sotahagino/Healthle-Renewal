'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Header } from "@/components/Header"

export default function AccountManagement() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@example.com')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      setError('すべての項目を入力してください。')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません。')
      return
    }

    try {
      // ここで実際にはAPIを呼び出してアカウント情報を更新します
      // このデモでは成功をシミュレートします
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess('アカウント情報が正常に更新されました。')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('アカウント情報の更新に失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">アカウント管理</h1>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>アカウント情報の更新</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">現在のパスワード</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">新しいパスワード</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default" className="bg-green-100 text-green-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>成功</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.push('/')}>
                  キャンセル
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

