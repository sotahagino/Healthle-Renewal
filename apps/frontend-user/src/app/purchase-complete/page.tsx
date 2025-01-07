'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import LoginModal from '@/components/login-modal'
import { CheckCircle, Package, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getGuestUserInfo } from '@/utils/guest-utils'

interface OrderStatus {
  orderId: string | null;
  status: 'pending' | 'paid' | 'error';
  error?: string;
}

interface ErrorComponentProps {
  error: Error;
  onRetry: () => void;
}

const ErrorComponent = ({ error, onRetry }: ErrorComponentProps) => (
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
    <SiteHeader />
    <main className="flex-grow container mx-auto px-4 py-8 mt-16">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-lg text-gray-600">{error.message}</p>
          <Button onClick={onRetry} className="bg-[#4C9A84] text-white">
            再試行
          </Button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default function PurchaseCompletePage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, loading, isGuestUser, loginAsGuest, authError } = useAuth()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [pageLoading, setPageLoading] = useState(true)
  const [initializationError, setInitializationError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({
    orderId: null,
    status: 'pending'
  })

  const checkOrderStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/orders/check-session?session_id=${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '注文情報の取得に失敗しました');
      }

      return data;
    } catch (error) {
      console.error('Error checking order status:', error);
      throw error;
    }
  };

  const initializeGuestUser = async () => {
    try {
      setInitializationError(null);
      const guestInfo = getGuestUserInfo();
      if (!user && guestInfo) {
        console.log('Found guest info, attempting to restore session');
        await loginAsGuest();
      }

      if (sessionId) {
        const orderData = await checkOrderStatus(sessionId);
        setOrderStatus({
          orderId: orderData.order_id,
          status: 'paid'
        });
      }
    } catch (error) {
      console.error('Failed to initialize guest user or check order:', error);
      setInitializationError(error as Error);
      setOrderStatus(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : '初期化に失敗しました'
      }));
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const initialize = async () => {
      if (!loading && mounted) {
        try {
          await initializeGuestUser();
        } catch (error) {
          if (mounted && retryCount < 3) {
            timeoutId = setTimeout(() => {
              setRetryCount(prev => prev + 1);
              initialize();
            }, Math.min(1000 * Math.pow(2, retryCount), 8000));
          }
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, user, loginAsGuest, sessionId, retryCount]);

  useEffect(() => {
    if (authError) {
      setInitializationError(authError);
    }
  }, [authError]);

  useEffect(() => {
    console.log('Purchase complete page state:', {
      loading,
      pageLoading,
      user,
      isGuestUser,
      sessionId,
      showLoginModal,
      initializationError,
      retryCount,
      orderStatus,
      timestamp: new Date().toISOString()
    });

    if (!loading && !pageLoading && user && isGuestUser && !showLoginModal) {
      console.log('Showing login modal for guest user');
      setShowLoginModal(true);
    }
  }, [loading, pageLoading, user, isGuestUser, sessionId, showLoginModal, initializationError, retryCount, orderStatus]);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setPageLoading(true);
    setOrderStatus({ orderId: null, status: 'pending' });
    await initializeGuestUser();
  };

  const handleLoginModalClose = () => {
    console.log('Attempting to close login modal:', {
      isGuestUser,
      timestamp: new Date().toISOString()
    });
    if (!isGuestUser) {
      setShowLoginModal(false);
    }
  };

  if (initializationError) {
    return <ErrorComponent error={initializationError} onRetry={handleRetry} />;
  }

  if (loading || pageLoading || orderStatus.status === 'pending') {
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

  if (orderStatus.status === 'error') {
    return <ErrorComponent 
      error={new Error(orderStatus.error || '注文情報の取得に失敗しました')} 
      onRetry={handleRetry} 
    />;
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
            {orderStatus.orderId && (
              <p className="text-sm text-gray-500">
                注文番号: {orderStatus.orderId}
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
          
          {isGuestUser && (
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
        isGuestUser={isGuestUser}
      />
    </div>
  )
} 