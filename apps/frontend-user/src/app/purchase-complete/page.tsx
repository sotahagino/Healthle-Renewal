'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import LoginModal from '@/components/login-modal'

export default function PurchaseCompletePage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, loading } = useAuth()

  // ゲストユーザーかどうかを判定
  const isGuestUser = () => {
    return user?.is_guest === true || 
           (user?.email && user.email.includes('@guest.healthle.com'))
  }

  useEffect(() => {
    // ローディングが完了し、ユーザー情報が取得できた後にゲストユーザーチェックを行う
    if (!loading && user && isGuestUser()) {
      console.log('Guest user detected:', { user })
      setShowLoginModal(true)
    }
  }, [loading, user])

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
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <p className="text-gray-600">読み込み中...</p>
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
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#4C9A84]">
            ご購入ありがとうございます
          </h1>
          
          <div className="text-center mb-6">
            <p className="text-gray-600">
              ご注文の確認メールをお送りしましたので、ご確認ください。
            </p>
          </div>
          
          {user && isGuestUser() && (
            <div className="mt-8 p-4 bg-[#E6F3EF] rounded-lg">
              <p className="text-center text-[#4C9A84] mb-4">
                LINEアカウントと連携して、商品の発送状況をお知らせします
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full bg-[#4C9A84] text-white py-2 rounded-lg hover:bg-[#3A8B73] transition-colors"
              >
                LINEで登録する
              </button>
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