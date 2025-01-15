import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // セッションの確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 商品データの取得
    const { data: product, error: productError } = await supabase
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
      .eq('id', params.id)
      .single();

    if (productError) {
      throw productError;
    }

    if (!product) {
      return new NextResponse('Product not found', { status: 404 });
    }

    // ユーザーが指定されたvendor_idにアクセスする権限があるか確認
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('vendor_id, role, status')
      .eq('user_id', session.user.id)
      .eq('vendor_id', product.vendor_id)
      .eq('status', 'active')
      .single();

    if (staffError || !staffRole) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 