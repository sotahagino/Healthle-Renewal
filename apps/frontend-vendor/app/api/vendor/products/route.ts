import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const data = await request.json();

    // セッションの確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // ユーザーが指定されたvendor_idにアクセスする権限があるか確認
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('vendor_id, role, status')
      .eq('user_id', session.user.id)
      .eq('vendor_id', data.vendor_id)
      .eq('status', 'active')
      .single();

    if (staffError || !staffRole) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 商品データの保存
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([
        {
          vendor_id: data.vendor_id,
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          image_url: data.image_url,
          status: data.status,
          purchase_limit: data.purchase_limit,
          stock_quantity: data.stock_quantity,
          medicine_type: data.medicine_type,
          ingredients: data.ingredients,
          effects: data.effects,
          usage_instructions: data.usage_instructions,
          precautions: data.precautions,
          requires_questionnaire: data.requires_questionnaire,
          requires_pharmacist_consultation: data.requires_pharmacist_consultation,
          shipping_info: data.shipping_info,
          manufacturer: data.manufacturer,
          manufacturing_country: data.manufacturing_country,
          expiration_date_info: data.expiration_date_info,
          storage_conditions: data.storage_conditions,
          out_of_stock_policy: data.out_of_stock_policy,
        },
      ])
      .select()
      .single();

    if (productError) {
      console.error('Product creation error:', productError);
      return new NextResponse(JSON.stringify({ error: productError.message }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // 問診票が必要な場合は問診票データを保存
    if (data.requires_questionnaire && data.questionnaire) {
      const { error: questionnaireError } = await supabase
        .from('questionnaires')
        .insert([
          {
            product_id: product.id,
            vendor_id: data.vendor_id,
            title: data.questionnaire.title,
            description: data.questionnaire.description,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (questionnaireError) {
        console.error('Questionnaire creation error:', questionnaireError);
        // 問診票の作成に失敗した場合は商品を削除
        await supabase
          .from('products')
          .delete()
          .eq('id', product.id);
        
        return new NextResponse(JSON.stringify({ error: '問診票の作成に失敗しました' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // 問診項目の保存
      const questionnaireItems = data.questionnaire.items.map((item: any, index: number) => ({
        questionnaire_id: product.id,
        question: item.question,
        question_type: item.question_type,
        required: item.required,
        options: item.options ? item.options.map((opt: { value: string }) => opt.value) : [],
        order_index: index,
      }));

      const { error: itemsError } = await supabase
        .from('questionnaire_items')
        .insert(questionnaireItems);

      if (itemsError) {
        console.error('Questionnaire items creation error:', itemsError);
        // 問診項目の作成に失敗した場合は商品と問診票を削除
        await supabase
          .from('products')
          .delete()
          .eq('id', product.id);
        
        return new NextResponse(JSON.stringify({ error: '問診項目の作成に失敗しました' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    return new NextResponse(JSON.stringify({ error: '商品の登録に失敗しました' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

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
    const { data: staffRole, error: staffError } = await supabase
      .from('vendor_staff_roles')
      .select('vendor_id, role, status')
      .eq('user_id', session.user.id)
      .eq('vendor_id', vendor_id)
      .eq('status', 'active')
      .single();

    if (staffError || !staffRole) {
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
        category,
        price,
        image_url,
        status,
        purchase_limit,
        stock_quantity,
        medicine_type,
        ingredients,
        effects,
        usage_instructions,
        precautions,
        requires_questionnaire,
        shipping_info,
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
    return new NextResponse(JSON.stringify({ error: '商品の取得に失敗しました' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 