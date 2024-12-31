import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeliveryInfo } from '@/hooks/useDeliveryInfo';
import { useCheckout } from '@/hooks/useCheckout';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
}

type PurchaseStatus = 'idle' | 'login' | 'delivery' | 'confirm' | 'processing' | 'complete' | 'error';

interface PurchaseContextType {
  status: PurchaseStatus;
  product: Product | null;
  isLoading: boolean;
  error: Error | null;
  deliveryInfo: ReturnType<typeof useDeliveryInfo>;
  startPurchase: (product: Product) => void;
  proceedToDelivery: () => void;
  proceedToConfirm: () => Promise<void>;
  proceedToCheckout: () => Promise<void>;
  reset: () => void;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deliveryInfo = useDeliveryInfo();
  const checkout = useCheckout();

  // 購入フローの開始
  const startPurchase = (selectedProduct: Product) => {
    setProduct(selectedProduct);
    setStatus('confirm');
  };

  // 配送情報入力へ進む
  const proceedToDelivery = () => {
    if (user) {
      setStatus('delivery');
    } else {
      setError(new Error('ログインが必要です'));
    }
  };

  // 購入確認へ進む
  const proceedToConfirm = async () => {
    try {
      setIsLoading(true);
      const success = await deliveryInfo.saveDeliveryInfo();
      if (success) {
        setStatus('confirm');
      } else {
        throw new Error('配送情報の保存に失敗しました');
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error('エラーが発生しました'));
    } finally {
      setIsLoading(false);
    }
  };

  // 決済処理へ進む
  const proceedToCheckout = async () => {
    if (!product) {
      setError(new Error('商品が選択されていません'));
      return;
    }

    try {
      setIsLoading(true);
      setStatus('processing');

      const sessionUrl = await checkout.createCheckoutSession([{
        product_id: product.id,
        price: product.price,
        quantity: 1,
      }]);

      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        throw new Error('決済セッションの作成に失敗しました');
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error('決済処理中にエラーが発生しました'));
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // 状態のリセット
  const reset = () => {
    setStatus('idle');
    setProduct(null);
    setError(null);
    setIsLoading(false);
  };

  // 認証状態の変更を監視
  useEffect(() => {
    if (status !== 'idle' && !loading && !user) {
      setStatus('login');
    }
  }, [user, loading, status]);

  return (
    <PurchaseContext.Provider
      value={{
        status,
        product,
        isLoading,
        error,
        deliveryInfo,
        startPurchase,
        proceedToDelivery,
        proceedToConfirm,
        proceedToCheckout,
        reset,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
} 