import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// テスト用の商品データ
const TEST_ITEMS = [
  {
    product_id: 'test_product_1',
    name: 'テスト商品1',
    price: 1000,
    quantity: 1
  },
  {
    product_id: 'test_product_2',
    name: 'テスト商品2',
    price: 2000,
    quantity: 2
  }
];

export async function GET(request: Request) {
  try {
    // テスト用の合計金額を計算
    const totalAmount = TEST_ITEMS.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: TEST_ITEMS.map(item => ({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        test_mode: 'true',
      },
    });

    return NextResponse.json({ 
      sessionUrl: session.url,
      testData: {
        items: TEST_ITEMS,
        totalAmount
      }
    });
  } catch (err: any) {
    console.error('Test payment error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }
} 