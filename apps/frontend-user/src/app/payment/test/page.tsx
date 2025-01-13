import { PaymentFormWrapper } from '@/components/PaymentForm';

export default function TestPaymentPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">決済テスト</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">テスト商品</h2>
          <p className="text-gray-600">価格: ¥1,000</p>
        </div>
        <PaymentFormWrapper 
          productId="test_product_1"
          amount={1000}
        />
      </div>
    </div>
  );
} 