'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import LoginModal from '@/components/login-modal'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PurchaseCompletePage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, loading, isGuestUser } = useAuth()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // ローディングが完了し、ユーザー情報が取得できた後にゲストユーザーチェックを行う
    if (!loading && user && isGuestUser()) {
      console.log('Guest user detected:', { user })
      setShowLoginModal(true)
    }
  }, [loading, user, isGuestUser])

  const handleLoginModalClose = () => {
    if (!isGuestUser()) {
      setShowLoginModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4C9A84] border-t-transparent" />
              <p className="text-lg text-gray-600">注文情報を確認中...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-[#4C9A84] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-[#4C9A84]">
              ご購入ありがとうございます
            </h1>
            <p className="text-gray-600 mb-2">
              ご注文の確認メールをお送りしましたので、ご確認ください。
            </p>
            {sessionId && (
              <p className="text-sm text-gray-500">
                注文番号: {sessionId}
              </p>
            )}
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-start p-4 bg-[#F0F8F5] rounded-lg">
              <Package className="w-6 h-6 text-[#4C9A84] mr-4 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-[#333333]">商品の発送について</h3>
                <p className="text-gray-600">商品の発送準備が整い次第、発送状況をお知らせいたします。</p>
              </div>
            </div>
          </div>
          
          {user && isGuestUser() && (
            <div className="mt-8 p-6 bg-[#E6F3EF] rounded-lg">
              <h2 className="text-xl font-bold text-[#4C9A84] mb-4 text-center">
                LINEで最新情報をお届け
              </h2>
              <p className="text-center text-gray-600 mb-6">
                LINEアカウントと連携すると、以下のサービスがご利用いただけます：
              </p>
              <ul className="space-y-3 mb-6 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#4C9A84] mr-2" />
                  商品の発送状況をリアルタイムでお知らせ
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#4C9A84] mr-2" />
                  お得なクーポンや最新情報をお届け
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-[#4C9A84] mr-2" />
                  注文履歴の確認や再注文が簡単に
                </li>
              </ul>
              <Button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-[#4C9A84] text-white py-3 rounded-lg hover:bg-[#3A8B73] transition-colors flex items-center justify-center space-x-2"
              >
                <span>LINEで登録する</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleLoginModalClose}
        isGuestUser={isGuestUser()}
      />
    </div>
  )
} 