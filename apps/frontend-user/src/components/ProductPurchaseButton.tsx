'use client';

import { useState } from 'react';
import { PaymentFormWrapper } from '@/components/PaymentFormWrapper';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductPurchaseButtonProps {
  product: Product;
  interviewId?: string | null;
}

export const ProductPurchaseButton = ({ product, interviewId }: ProductPurchaseButtonProps) => {
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() => setShowPayment(true)}
        className="w-full bg-gradient-to-r from-[#FF9900] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF7A00] text-white px-6 py-4 rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg font-bold text-lg flex items-center justify-center space-x-2"
      >
        <span>今すぐ購入</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>商品の購入</DialogTitle>
          <DialogDescription>
            以下の商品の購入手続きを行います。
          </DialogDescription>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              <p className="text-2xl font-bold">¥{product.price.toLocaleString()}</p>
            </div>
            <PaymentFormWrapper
              productId={product.id}
              amount={product.price}
              interviewId={interviewId || undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <p className="mt-2 text-red-600 text-sm text-center">{error}</p>
      )}
    </div>
  );
}; 