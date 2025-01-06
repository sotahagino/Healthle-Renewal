'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle } from 'lucide-react'
import { LoginContent } from '@/components/login-content'

export default function PurchaseCompletePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [returnTo, setReturnTo] = useState('')

  useEffect(() => {
    // クライアントサイドでのみwindow.locationを使用
    setReturnTo(typeof window !== 'undefined' ? '/purchase-complete' : '')

    // 最新の注文情報を取得
    const fetchLatestOrder = async () => {
      try {
        const response = await fetch('/api/orders/latest');
        const data = await response.json();
        
        if (data.order_id) {
          // 既存のpurchaseFlowデータを取得
          const existingPurchaseFlow = localStorage.getItem('purchaseFlow');
          if (existingPurchaseFlow) {
            const purchaseFlowData = JSON.parse(existingPurchaseFlow);
            
            // 既存のデータを保持しながら、order_idとtimestampを更新
            const updatedPurchaseFlow = {
              ...purchaseFlowData,
              order_id: data.order_id,  // vendor_ordersテーブルのorder_id
              timestamp: Date.now()
            };
            
            localStorage.setItem('purchaseFlow', JSON.stringify(updatedPurchaseFlow));
            console.log('Updated purchaseFlow with vendor_orders order_id:', data.order_id);
          } else {
            console.warn('No purchaseFlow data found in localStorage');
          }
        } else {
          console.warn('No order_id found in latest order');
        }
      } catch (error) {
        console.error('Error fetching latest order:', error);
      }
    };

    fetchLatestOrder();
  }, [])

  useEffect(() => {
    // ログインしていない場合、モーダルを表示
    if (!loading && !user) {
      setIsModalOpen(true)
    }
  }, [user, loading])

  // LINEログイン処理
  const handleLineLogin = () => {
    try {
      const lineLoginUrl = process.env.NEXT_PUBLIC_LINE_LOGIN_URL
      if (lineLoginUrl) {
        const loginUrl = new URL(lineLoginUrl)
        loginUrl.searchParams.set('return_to', '/purchase-complete')

        // purchaseFlowをlocalStorageから取得
        const purchaseFlow = localStorage.getItem('purchaseFlow')
        if (purchaseFlow) {
          const purchaseFlowData = JSON.parse(purchaseFlow)
          console.log('Current purchaseFlow data:', purchaseFlowData)
          
          // order_idを含めて保持
          localStorage.setItem('purchaseFlow', JSON.stringify({
            product: purchaseFlowData.product,
            timestamp: purchaseFlowData.timestamp,
            order_id: purchaseFlowData.order_id
          }))
          console.log('Preserved purchaseFlow data with order_id')
        }

        window.location.href = loginUrl.toString()
      } else {
        throw new Error('LINE login URL is not configured')
      }
    } catch (error) {
      console.error('LINE login error:', error)
      alert('ログインに失敗しました。もう一度お試しください。')
    }
  }

  useEffect(() => {
    const updatePurchaseFlow = async () => {
      try {
        // URLからsession_idを取得
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        console.log('Got session_id from URL:', sessionId);

        if (!sessionId) {
          console.error('No session_id found in URL');
          return;
        }

        // 既存のpurchaseFlowデータを確認
        const existingPurchaseFlow = localStorage.getItem('purchaseFlow');
        console.log('Current purchaseFlow data:', existingPurchaseFlow);

        // Stripeセッションの状態を確認
        console.log('Checking session status...');
        const response = await fetch('/api/orders/check-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Session check failed:', errorData);
          // エラーの場合は一定時間後に再試行
          setTimeout(updatePurchaseFlow, 5000);
          return;
        }

        const data = await response.json();
        console.log('Session check response:', data);

        if (!data.order_id) {
          console.error('No order_id in response');
          // order_idがない場合も一定時間後に再試行
          setTimeout(updatePurchaseFlow, 5000);
          return;
        }

        // purchaseFlowデータを更新
        const purchaseFlowData = existingPurchaseFlow 
          ? JSON.parse(existingPurchaseFlow)
          : {};

        purchaseFlowData.order_id = data.order_id;
        purchaseFlowData.timestamp = Date.now();
        purchaseFlowData.session_id = sessionId;

        localStorage.setItem('purchaseFlow', JSON.stringify(purchaseFlowData));
        console.log('Updated purchaseFlow data:', purchaseFlowData);

      } catch (error) {
        console.error('Error updating purchaseFlow:', error);
        // エラーの場合は一定時間後に再試行
        setTimeout(updatePurchaseFlow, 5000);
      }
    };

    updatePurchaseFlow();
  }, []);

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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <LoginContent
            onLogin={handleLineLogin}
            returnTo={returnTo}
            title="商品の発送状況を受け取る"
            message="ご購入ありがとうございます。商品の発送状況や配送状況をLINEでお知らせするために、LINEアカウントと連携してください。"
            additionalMessage={
              <ul className="text-[#666666] space-y-2 mt-4">
                <li>• 商品の発送状況</li>
                <li>• 配送状況の追跡情報</li>
                <li>• お届け完了のお知らせ</li>
              </ul>
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 