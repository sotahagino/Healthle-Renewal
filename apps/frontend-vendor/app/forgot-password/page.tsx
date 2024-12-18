'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // ここで実際にはAPIを呼び出してパスワードリセットメールを送信します
      // 今回はモックの動作をシミュレートします
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (err) {
      setError('パスワードリセットメールの送信に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Image
                src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
                alt="Healthle Logo"
                width={80}
                height={80}
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-[#333333]">メール送信完了</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              パスワードリセットの手順を記載したメールを送信しました。メールの指示に従って新しいパスワードを設定してください。
            </p>
            <Button
              className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
              onClick={() => router.push('/login')}
            >
              ログイン画面に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Image
              src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
              alt="Healthle Logo"
              width={80}
              height={80}
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#333333]">パスワードをお忘れですか？</CardTitle>
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
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full mt-6 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? '送信中...' : 'リセットメールを送信'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-[#4C9A84] hover:underline flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ログイン画面に戻る
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

