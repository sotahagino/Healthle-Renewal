import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CheckoutButton } from '@/components/checkout-button';

export default async function CheckoutConfirmPage({
  searchParams,
}: {
  searchParams: { product_id: string };
}) {
  try {
    // 1. Cookieストアの取得
    const cookieStore = cookies();

    // 2. Supabaseクライアントの初期化
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // 3. セッションの取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // 4. セッションのチェック
    if (!session?.user?.id) {
      console.error('No active session found');
      redirect('/login');
    }

    // 5. 商品情報の取得
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', searchParams.product_id)
      .single();

    if (productError || !product) {
      console.error('Product error:', productError);
      redirect('/');
    }

    // 6. ユーザー情報の取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('User error:', userError);
      redirect('/mypage');
    }

    // デバッグ情報の出力
    console.log('User data:', {
      name: userData?.name || 'missing',
      phone: userData?.phone_number || 'missing',
      postal: userData?.postal_code || 'missing',
      prefecture: userData?.prefecture || 'missing',
      city: userData?.city || 'missing'
    });

    // 7. 必要な配送情報の確認
    const missingFields = [];
    if (!userData?.name) missingFields.push('name');
    if (!userData?.phone_number) missingFields.push('phone_number');
    if (!userData?.postal_code) missingFields.push('postal_code');

    if (missingFields.length > 0) {
      console.error('Missing required user information:', missingFields);
      redirect('/mypage');
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">注文内容の確認</h1>
          
          {/* 商品情報 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">商品情報</h2>
            <div className="flex items-center">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="ml-4">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-gray-600">¥{product.price.toLocaleString()}</p>
                <p className="text-sm text-gray-500">数量: 1</p>
              </div>
            </div>
          </div>

          {/* 配送先情報 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">配送先情報</h2>
            <div>
              <p>{userData.name}</p>
              <p>〒{userData.postal_code}</p>
              <p>{userData.prefecture}{userData.city}</p>
              <p>電話番号: {userData.phone_number}</p>
            </div>
          </div>

          {/* 金額情報 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">お支払い金額</h2>
            <div className="flex justify-between mb-2">
              <span>商品金額</span>
              <span>¥{product.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>送料</span>
              <span>¥0</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>合計</span>
                <span>¥{product.price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 決済ボタン */}
          <CheckoutButton productId={product.id} price={product.price} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Checkout confirm error:', error);
    redirect('/');
  }
} 