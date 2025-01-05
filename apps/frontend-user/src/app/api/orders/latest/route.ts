import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 最新の注文情報を取得
    const { data: latestOrder, error } = await supabase
      .from('vendor_orders')
      .select('order_id, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    if (!latestOrder) {
      return NextResponse.json({ error: 'No order found' }, { status: 404 });
    }

    return NextResponse.json({
      order_id: latestOrder.order_id,
      timestamp: new Date(latestOrder.created_at).getTime()
    });
  } catch (error) {
    console.error('Error fetching latest order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest order' },
      { status: 500 }
    );
  }
} 