'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // ここでは実際の認証は行わず、入力チェックのみを行います
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。')
      return
    }
    // 実際のアプリケーションでは、ここで認証処理を行います
    // 今回はホームへ遷移するだけとします
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/healthle-logo.png"
              alt="Healthle Logo"
              width={80}
              height={80}
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#333333]">出店者ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          {resetSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">成功</AlertTitle>
              <AlertDescription className="text-green-700">
                パスワードが正常にリセットされました。新しいパスワードでログインしてください。
              </AlertDescription>
            </Alert>
          )}
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
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/forgot-password" className="text-sm text-[#4C9A84] hover:underline">
            パスワードをお忘れですか？
          </Link>
          <p className="text-xs text-[#666666] text-center">
            ログインすることで、
            <Link href="/terms" className="text-[#4C9A84] hover:underline">利用規約</Link>
            と
            <Link href="/privacy" className="text-[#4C9A84] hover:underline">プライバシーポリシー</Link>
            に同意したことになります。
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

