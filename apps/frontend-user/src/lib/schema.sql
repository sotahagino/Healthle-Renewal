-- Webhookログテーブル
CREATE TABLE webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE,
  event_type VARCHAR(100),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50),
  error_message TEXT
);

-- vendor_ordersテーブルにuser_idカラムを追加
ALTER TABLE vendor_orders
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- vendor_ordersテーブルにconsultation_idカラムを追加
ALTER TABLE vendor_orders
ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id);

-- webhook_logsテーブルにprocessed_dataカラムを追加
ALTER TABLE webhook_logs
ADD COLUMN IF NOT EXISTS processed_data JSONB;

-- 注文テーブル
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  status VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  stripe_payment_link_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  shipping_name VARCHAR(255),
  shipping_postal_code VARCHAR(10),
  shipping_prefecture VARCHAR(50),
  shipping_city VARCHAR(255),
  shipping_address TEXT,
  shipping_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- vendor_ordersテーブルにstripe_session_idカラムを追加
ALTER TABLE vendor_orders
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

-- stripe_session_idにインデックスを追加（検索パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_vendor_orders_stripe_session_id ON vendor_orders(stripe_session_id);

-- ゲストユーザーデータ移行用のストアドプロシージャ
CREATE OR REPLACE FUNCTION migrate_guest_user_data(
  old_user_id UUID,
  new_user_id UUID
) RETURNS void AS $$
BEGIN
  -- トランザクション開始
  BEGIN
    -- consultationsテーブルの更新
    UPDATE consultations 
    SET user_id = new_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = old_user_id;

    -- vendor_ordersテーブルの更新
    UPDATE vendor_orders 
    SET user_id = new_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = old_user_id;

    -- ordersテーブルの更新
    UPDATE orders 
    SET user_id = new_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = old_user_id;

    -- 古いゲストユーザー情報を更新
    UPDATE users 
    SET is_guest = false,
        migrated_to = new_user_id,
        migrated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = old_user_id;

    -- 成功した場合はコミット
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- エラーが発生した場合はロールバック
      ROLLBACK;
      RAISE EXCEPTION 'Failed to migrate user data: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql; 

-- usersテーブルにマイグレーション関連のカラムを追加
ALTER TABLE users
ADD COLUMN IF NOT EXISTS migrated_to UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS migration_status VARCHAR(50) DEFAULT 'not_migrated';

-- マイグレーションステータスのインデックスを追加
CREATE INDEX IF NOT EXISTS idx_users_migration_status ON users(migration_status);

-- マイグレーション履歴テーブルの作成
CREATE TABLE IF NOT EXISTS user_migration_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  old_user_id UUID NOT NULL,
  new_user_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (old_user_id) REFERENCES users(id),
  FOREIGN KEY (new_user_id) REFERENCES users(id)
); 