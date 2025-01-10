'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PurchaseCompletePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<{
    orderId: string | null;
    status: 'pending' | 'paid' | 'error';
  }>({
    orderId: null,
    status: 'pending'
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const sessionId = searchParams.get('session_id')

    if (sessionId && !user) {
      const fetchSessionDetails = async () => {
        try {
          const response = await fetch(`/api/orders/check-session?session_id=${sessionId}`)
          const data = await response.json()
          
          if (!response.ok) throw new Error(data.error || '注文情報の取得に失敗しました')
          
          setOrderStatus({
            orderId: data.order_id,
            status: 'paid'
          })
          
          if (data.customer_email) {
            setEmail(data.customer_email)
          }
        } catch (error) {
          console.error('Error fetching session details:', error)
          setOrderStatus(prev => ({
            ...prev,
            status: 'error'
          }))
        } finally {
          setLoading(false)
        }
      }

      fetchSessionDetails()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const tempUid = localStorage.getItem('temp_uid')
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          temp_uid: tempUid
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'アカウント登録に失敗しました')
      }

      // 登録成功後、temp_uidを削除
      localStorage.removeItem('temp_uid')
      router.push('/mypage')
    } catch (error) {
      console.error('Signup error:', error)
      setError(error instanceof Error ? error.message : 'アカウント登録に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin text-[#4C9A84]" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] to-white">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#4C9A84]">
              ご購入ありがとうございます
            </CardTitle>
            <CardDescription>
              ご注文の確認メールをお送りしましたので、ご確認ください。
            </CardDescription>
            {orderStatus.orderId && (
              <p className="text-sm text-gray-500">
                注文番号: {orderStatus.orderId}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!user && orderStatus.status === 'paid' && (
              <div className="mt-8">
                <div className="bg-[#F8FBFA] p-6 rounded-lg mb-6">
                  <h2 className="text-xl font-bold text-[#4C9A84] mb-4">
                    アカウント登録のご案内
                  </h2>
                  <p className="text-gray-600 mb-4">
                    アカウントを登録すると、以下のサービスがご利用いただけます：
                  </p>
                  <ul className="space-y-2 text-gray-600 mb-6">
                    <li>• 注文履歴の確認</li>
                    <li>• 配送状況の追跡</li>
                    <li>• 過去の相談内容の確認</li>
                  </ul>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">パスワード</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8文字以上の英数字"
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
                  >
                    アカウントを作成
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 