'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from './PaymentForm';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be set in environment variables');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormWrapperProps {
  productId: string;
  amount: number;
  medical_interview_id?: string;
  metadata?: {
    medical_interview_id?: string;
  };
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
}

export function PaymentFormWrapper({ productId, amount, medical_interview_id, metadata }: PaymentFormWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const fetchAttempted = useRef(false);
  const supabase = createClientComponentClient();

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, [supabase]);

  const fetchClientSecret = useCallback(async () => {
    if (fetchAttempted.current || !productId) return;
    
    setIsLoading(true);
    setError(undefined);
    fetchAttempted.current = true;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            product_id: productId,
            quantity: 1
          }]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '決済の初期化に失敗しました');
      }

      if (!data.client_secret) {
        throw new Error('Client secretの取得に失敗しました');
      }

      setClientSecret(data.client_secret);
    } catch (err) {
      console.error('Error fetching client secret:', err);
      setError(err instanceof Error ? err.message : '決済の初期化に失敗しました');
      fetchAttempted.current = false; // エラー時は再試行を許可
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchClientSecret();
    fetchUserProfile();
  }, [fetchClientSecret, fetchUserProfile]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            fetchAttempted.current = false;
            fetchClientSecret();
          }}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">決済フォームを準備中...</span>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm 
        clientSecret={clientSecret}
        interviewId={medical_interview_id}
        userProfile={userProfile}
      />
    </Elements>
  );
} 