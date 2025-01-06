'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginModal } from '@/components/LoginModal'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'

export default function PurchaseCompletePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/orders/check-session')
        const data = await response.json()
        
        if (data.purchase_flow) {
          localStorage.setItem('purchaseFlow', JSON.stringify(data.purchase_flow))
          console.log('Successfully saved purchaseFlow:', data.purchase_flow)
        }

        if (!loading && !user) {
          setIsLoginModalOpen(true)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    checkSession()
  }, [user, loading])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-2xl mx-auto bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-[#4C9A84] mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-[#333333] mb-4">
                ご購入ありがとうございます
              </h1>
              <p className="text-[#666666] mb-2">
                商品のご購入が完了しました。
              </p>
              <p className="text-[#666666]">
                ご登録いただいたメールアドレスに確認メールをお送りしました。
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-[#F0F8F5] p-4 rounded-lg">
                <h2 className="font-semibold text-[#4C9A84] mb-2">次のステップ</h2>
                <ul className="space-y-2 text-[#666666]">
                  <li>• 商品の発送準備が整い次第、発送のお知らせメールをお送りします</li>
                  <li>• 商品の到着まで今しばらくお待ちください</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/mypage')}
                  className="flex-1"
                >
                  マイページへ
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  className="flex-1 bg-[#4C9A84]"
                >
                  トップページへ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  )
} 