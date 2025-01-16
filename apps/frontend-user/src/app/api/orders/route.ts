import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    // 合計金額の計算
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    // ユーザーIDの取得（認証情報から）
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ordersレコードを作成
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert([{
        total_amount: totalAmount,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderErr) {
      throw orderErr;
    }

    // order_itemsレコードを作成
    for (const item of items) {
      const { error: itemErr } = await supabaseAdmin
        .from('order_items')
        .insert([{
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }]);

      if (itemErr) {
        throw itemErr;
      }
    }

    return NextResponse.json({ 
      order_id: order.id, 
      total_amount: totalAmount 
    });

  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 