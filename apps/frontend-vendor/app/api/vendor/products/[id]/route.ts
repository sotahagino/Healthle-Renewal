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
        stock_quantity,
        medicine_type,
        ingredients,
        effects,
        usage_instructions,
        precautions,
        requires_questionnaire,
        requires_pharmacist_consultation,
        shipping_info,
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

    // 問診票データの取得
    if (product.requires_questionnaire) {
      const { data: questionnaire, error: questionnaireError } = await supabase
        .from('questionnaires')
        .select(`
          id,
          title,
          description,
          questionnaire_items (
            id,
            question,
            question_type,
            required,
            options,
            order_index
          )
        `)
        .eq('product_id', params.id)
        .single();

      if (!questionnaireError && questionnaire) {
        product.questionnaire = {
          title: questionnaire.title,
          description: questionnaire.description,
          items: questionnaire.questionnaire_items,
        };
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product fetch error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // 商品データの更新
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
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
      })
      .eq('id', params.id)
      .select()
      .single();

    if (productError) {
      throw productError;
    }

    // 問診票の更新
    if (data.requires_questionnaire && data.questionnaire) {
      // 既存の問診票を取得
      const { data: existingQuestionnaire } = await supabase
        .from('questionnaires')
        .select('id')
        .eq('product_id', params.id)
        .single();

      if (existingQuestionnaire) {
        // 既存の問診票を更新
        const { error: questionnaireError } = await supabase
          .from('questionnaires')
          .update({
            title: data.questionnaire.title,
            description: data.questionnaire.description,
          })
          .eq('id', existingQuestionnaire.id);

        if (questionnaireError) {
          throw questionnaireError;
        }

        // 既存の問診項目を削除
        await supabase
          .from('questionnaire_items')
          .delete()
          .eq('questionnaire_id', existingQuestionnaire.id);

        // 新しい問診項目を追加
        const questionnaireItems = data.questionnaire.items.map((item: any, index: number) => ({
          questionnaire_id: existingQuestionnaire.id,
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
          throw itemsError;
        }
      } else {
        // 新規問診票を作成
        const { data: newQuestionnaire, error: questionnaireError } = await supabase
          .from('questionnaires')
          .insert([
            {
              product_id: params.id,
              vendor_id: data.vendor_id,
              title: data.questionnaire.title,
              description: data.questionnaire.description,
              status: 'active',
            },
          ])
          .select()
          .single();

        if (questionnaireError) {
          throw questionnaireError;
        }

        // 問診項目を追加
        const questionnaireItems = data.questionnaire.items.map((item: any, index: number) => ({
          questionnaire_id: newQuestionnaire.id,
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
          throw itemsError;
        }
      }
    } else {
      // 問診票が不要になった場合は削除（カスケード削除で問診項目も削除される）
      await supabase
        .from('questionnaires')
        .delete()
        .eq('product_id', params.id);
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    return new NextResponse(JSON.stringify({ error: '商品の更新に失敗しました' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 