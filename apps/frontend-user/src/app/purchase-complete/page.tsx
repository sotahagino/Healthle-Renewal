'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PurchaseComplete() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const sessionId = searchParams.get('session_id')
      if (!sessionId) {
        setError('セッションIDが見つかりません')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/checkout/check-session?session_id=${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '注文の確認に失敗しました')
        }

        // 成功時の処理
        setIsLoading(false)
      } catch (error) {
        console.error('Session check error:', error)
        setError(error instanceof Error ? error.message : '注文の確認中にエラーが発生しました')
        setIsLoading(false)
      }
    }

    checkSession()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>注文を確認中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              トップページに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-green-600 mb-4">ご注文ありがとうございます</h1>
          <p className="text-gray-600 mb-6">
            ご注文の確認が完了しました。商品の発送準備に入らせていただきます。
          </p>
          <div className="space-y-4">
            <Button onClick={() => router.push('/orders')} className="w-full">
              注文履歴を確認する
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              トップページに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 