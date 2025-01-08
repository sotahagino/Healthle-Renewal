-- ゲストユーザーデータ移行用の関数
CREATE OR REPLACE FUNCTION public.migrate_guest_user_data(
  p_guest_user_id UUID,
  p_new_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- トランザクション開始
  BEGIN
    -- vendor_ordersの更新
    UPDATE public.vendor_orders
    SET user_id = p_new_user_id
    WHERE user_id = p_guest_user_id;

    -- consultationsの更新
    UPDATE public.consultations
    SET user_id = p_new_user_id
    WHERE user_id = p_guest_user_id;

    -- ゲストユーザーの状態更新
    UPDATE public.users
    SET 
      migrated_to = p_new_user_id,
      migrated_at = NOW(),
      migration_status = 'migrated'
    WHERE id = p_guest_user_id;

    -- トランザクション終了
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- エラー発生時はロールバック
      ROLLBACK;
      RAISE;
  END;
END;
$$; 