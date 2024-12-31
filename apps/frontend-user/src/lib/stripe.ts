import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// サーバーサイド用のStripeインスタンス
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// クライアントサイド用のStripeインスタンス
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
}; 