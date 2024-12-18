'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。')
      return
    }

    try {
      // Here you would typically call your authentication API
      // For now, we'll just simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/') // Changed from '/dashboard' to '/'
    } catch (err) {
      setError('ログインに失敗しました。認証情報を確認してください。')
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image
              src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
              alt="Healthle Logo"
              width={80}
              height={80}
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#333333]">管理者ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full mt-6 bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
              ログイン
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

