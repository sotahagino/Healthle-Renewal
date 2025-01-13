'use client';

import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

interface PaymentFormProps {
  clientSecret: string;
}

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  line1: string;
  line2: string;
}

export function PaymentForm({ clientSecret }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showDetailedAddress, setShowDetailedAddress] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    email: '',
    phone: '',
    postalCode: '',
    prefecture: '',
    city: '',
    line1: '',
    line2: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/complete`,
          shipping: {
            name: shippingInfo.name,
            phone: shippingInfo.phone,
            address: {
              country: 'JP',
              postal_code: shippingInfo.postalCode,
              state: shippingInfo.prefecture,
              city: shippingInfo.city,
              line1: shippingInfo.line1,
              line2: shippingInfo.line2
            }
          },
          receipt_email: shippingInfo.email
        },
      });

      if (submitError) {
        setError(submitError.message || '決済処理に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '決済処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShippingInfoChange = (field: keyof ShippingInfo) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setShippingInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const postalCode = e.target.value.replace(/[^0-9]/g, '');
    setShippingInfo(prev => ({ ...prev, postalCode }));

    if (postalCode.length === 7) {
      setIsLoadingAddress(true);
      try {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
        const data = await response.json();
        
        if (data.results?.[0]) {
          const address = data.results[0];
          setShippingInfo(prev => ({
            ...prev,
            prefecture: address.address1,
            city: address.address2,
            line1: address.address3,
            line2: ''
          }));
          setShowDetailedAddress(true);
        }
      } catch (err) {
        setError('郵便番号から住所を取得できませんでした');
      } finally {
        setIsLoadingAddress(false);
      }
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto px-4 py-2">
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="お名前"
            value={shippingInfo.name}
            onChange={handleShippingInfoChange('name')}
            required
            className="w-full p-2 border rounded-md"
          />
          <input
            type="email"
            placeholder="メールアドレス"
            value={shippingInfo.email}
            onChange={handleShippingInfoChange('email')}
            required
            className="w-full p-2 border rounded-md"
          />
          <input
            type="tel"
            placeholder="電話番号"
            value={shippingInfo.phone}
            onChange={handleShippingInfoChange('phone')}
            required
            className="w-full p-2 border rounded-md"
          />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="郵便番号（ハイフンなし）"
                value={shippingInfo.postalCode}
                onChange={handlePostalCodeChange}
                maxLength={7}
                required
                className="w-full p-2 border rounded-md"
              />
              {isLoadingAddress && <span className="text-sm text-gray-500">住所を検索中...</span>}
            </div>

            {showDetailedAddress && (
              <>
                <input
                  type="text"
                  placeholder="都道府県"
                  value={shippingInfo.prefecture}
                  onChange={handleShippingInfoChange('prefecture')}
                  required
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="市区町村"
                  value={shippingInfo.city}
                  onChange={handleShippingInfoChange('city')}
                  required
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="町名・番地"
                  value={shippingInfo.line1}
                  onChange={handleShippingInfoChange('line1')}
                  required
                  className="w-full p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="建物名・部屋番号（任意）"
                  value={shippingInfo.line2}
                  onChange={handleShippingInfoChange('line2')}
                  className="w-full p-2 border rounded-md"
                />
              </>
            )}
          </div>
        </div>

        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
        
        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
        >
          {isProcessing ? '処理中...' : '支払う'}
        </button>
      </form>
    </div>
  );
} 