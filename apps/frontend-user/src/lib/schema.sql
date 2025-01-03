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