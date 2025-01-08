-- ゲストユーザーデータ移行用の関数
CREATE OR REPLACE FUNCTION public.migrate_guest_user_data(
  p_guest_user_id UUID,
  p_new_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consultation_count INTEGER;
BEGIN
  -- トランザクション開始
  BEGIN
    -- 移行対象の相談データ数を確認
    SELECT COUNT(*)
    INTO v_consultation_count
    FROM public.consultations
    WHERE user_id = p_guest_user_id;

    -- consultationsの更新
    UPDATE public.consultations
    SET 
      user_id = p_new_user_id,
      updated_at = NOW()
    WHERE user_id = p_guest_user_id;

    -- vendor_ordersの更新
    UPDATE public.vendor_orders
    SET 
      user_id = p_new_user_id,
      updated_at = NOW()
    WHERE user_id = p_guest_user_id;

    -- ゲストユーザーの状態更新
    UPDATE public.users
    SET 
      migrated_to = p_new_user_id,
      migrated_at = NOW(),
      migration_status = 'migrated',
      updated_at = NOW()
    WHERE id = p_guest_user_id;

    -- 移行ログの記録
    INSERT INTO public.user_migration_logs (
      old_user_id,
      new_user_id,
      status,
      created_at
    ) VALUES (
      p_guest_user_id,
      p_new_user_id,
      'completed',
      NOW()
    );

    -- トランザクション終了
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- エラー発生時はロールバック
      ROLLBACK;
      
      -- エラーログの記録
      INSERT INTO public.user_migration_logs (
        old_user_id,
        new_user_id,
        status,
        error_message,
        created_at
      ) VALUES (
        p_guest_user_id,
        p_new_user_id,
        'failed',
        SQLERRM,
        NOW()
      );
      
      RAISE;
  END;
END;
$$; 