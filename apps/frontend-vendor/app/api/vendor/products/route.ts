import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendor_id = searchParams.get('vendor_id');

    if (!vendor_id) {
      return new NextResponse('Vendor ID is required', { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // セッションの確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // ユーザーが指定されたvendor_idにアクセスする権限があるか確認
    const { data: vendorUser, error: vendorError } = await supabase
      .from('vendor_users')
      .select('vendor_id')
      .eq('user_id', session.user.id)
      .eq('vendor_id', vendor_id)
      .single();

    if (vendorError || !vendorUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 商品データの取得
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        vendor_id,
        name,
        description,
        image_url,
        category,
        price,
        status,
        purchase_limit,
        questionnaire_required,
        created_at,
        updated_at
      `)
      .eq('vendor_id', vendor_id)
      .order('created_at', { ascending: false });

    if (productsError) {
      throw productsError;
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Products fetch error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 