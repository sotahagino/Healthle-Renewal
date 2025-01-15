-- 既存のテーブルを削除
DROP TABLE IF EXISTS vendor_pharmacists CASCADE;
DROP TABLE IF EXISTS vendor_users CASCADE;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "vendor_staff_roles_select" ON vendor_staff_roles;
DROP POLICY IF EXISTS "vendor_staff_roles_insert" ON vendor_staff_roles;
DROP POLICY IF EXISTS "vendor_staff_roles_update" ON vendor_staff_roles;
DROP POLICY IF EXISTS "pharmacist_certifications_select" ON pharmacist_certifications;
DROP POLICY IF EXISTS "pharmacist_certifications_insert" ON pharmacist_certifications;
DROP POLICY IF EXISTS "pharmacist_certifications_update" ON pharmacist_certifications;

-- usersテーブルにuser_typeカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'end_user';
ALTER TABLE users ADD CONSTRAINT valid_user_type CHECK (user_type IN ('end_user', 'vendor_staff'));

-- 新しいテーブルの作成
CREATE TABLE IF NOT EXISTS vendor_staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'staff',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'staff', 'pharmacist')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE TABLE IF NOT EXISTS pharmacist_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_role_id UUID REFERENCES vendor_staff_roles(id),
  license_number TEXT NOT NULL,
  license_image_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS vendor_staff_roles_vendor_id_idx ON vendor_staff_roles(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_staff_roles_user_id_idx ON vendor_staff_roles(user_id);
CREATE INDEX IF NOT EXISTS pharmacist_certifications_staff_role_id_idx ON pharmacist_certifications(staff_role_id);

-- RLSの有効化
ALTER TABLE vendor_staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist_certifications ENABLE ROW LEVEL SECURITY;

-- 基本的なポリシーの作成
CREATE POLICY "vendor_staff_roles_select" ON vendor_staff_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendor_staff_roles_insert" ON vendor_staff_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "vendor_staff_roles_update" ON vendor_staff_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "pharmacist_certifications_select" ON pharmacist_certifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pharmacist_certifications_insert" ON pharmacist_certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "pharmacist_certifications_update" ON pharmacist_certifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- auth.usersテーブルへのアクセス権限を設定
CREATE POLICY "Enable read access for authenticated users" ON auth.users
  FOR SELECT
  TO authenticated
  USING (true);

-- vendor_staff_rolesテーブルのポリシーを更新
ALTER TABLE vendor_staff_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON vendor_staff_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON vendor_staff_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON vendor_staff_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- pharmacist_certificationsテーブルのポリシーも更新
ALTER TABLE pharmacist_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON pharmacist_certifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON pharmacist_certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON pharmacist_certifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true); 