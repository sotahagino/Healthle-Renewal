'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/useAuth'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import LoginModal from '@/components/login-modal'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function PurchaseCompletePage() {
  const searchParams = useSearchParams()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, isGuestUser } = useAuth()
  const supabase = createClientComponentClient()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const sessionId = searchParams.get('session_id')
        if (!sessionId) {
          setError('注文情報が見つかりません')
          return
        }

        const response = await fetch(`/api/orders/check-session?session_id=${sessionId}`)
        if (!response.ok) {
          throw new Error('Failed to check session')
        }

        const purchaseFlowData = await response.json()
        console.log('Purchase flow data:', purchaseFlowData)

        const { data: orderData, error: orderError } = await supabase
          .from('vendor_orders')
          .select(`
            *,
            product:product_id (*)
          `)
          .eq('stripe_session_id', sessionId)
          .single()

        if (orderError) throw orderError
        if (!orderData) {
          setError('注文情報が見つかりません')
          return
        }

        setOrder(orderData)

        if (isGuestUser()) {
          setShowLoginModal(true)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        setError('注文情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [searchParams, isGuestUser])

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
          <div className="text-center">
            <p>読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <Alert variant="destructive">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
          
          {order && (
            <div className="space-y-6">
              <div className="border-t border-b py-4">
                <h2 className="text-lg font-semibold mb-2">注文番号</h2>
                <p className="text-gray-600">{order.order_id}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-2">購入商品</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{order.product.name}</p>
                      <p className="text-sm text-gray-600">数量: 1</p>
                    </div>
                    <p className="font-medium">
                      ¥{order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">合計金額</p>
                  <p className="text-lg font-bold text-[#4C9A84]">
                    ¥{order.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isGuestUser() && (
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