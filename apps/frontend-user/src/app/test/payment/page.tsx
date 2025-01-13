import { PaymentFormWrapper } from '@/components/PaymentFormWrapper';

export default function TestPaymentPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">決済テスト</h1>
      <div className="mb-8">
        <h2 className="text-xl mb-2">テスト商品</h2>
        <p className="mb-2">価格: ¥1,000</p>
      </div>
      <PaymentFormWrapper 
        productId="123e4567-e89b-12d3-a456-426614174000"
        amount={1000} 
      />
    </div>
  );
} 