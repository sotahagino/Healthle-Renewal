# Healthle 管理者用データベーススキーマ

## 管理者関連テーブル

### admin_users
管理者ユーザー情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| email | text | YES | NULL | メールアドレス |
| password_hash | text | YES | NULL | パスワードハッシュ |
| role | text | YES | NULL | 権限ロール |
| name | text | YES | NULL | 管理者名 |
| user_id | uuid | YES | gen_random_uuid() | 関連ユーザーID |

## 薬局関連テーブル

### vendors
薬局情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_name | text | YES | NULL | 薬局名 |
| status | text | YES | NULL | ステータス |
| email | text | YES | NULL | メールアドレス |
| phone | text | YES | NULL | 電話番号 |
| postal_code | text | YES | NULL | 郵便番号 |
| prefecture | text | YES | NULL | 都道府県 |
| city | text | YES | NULL | 市区町村 |
| address_line1 | text | YES | NULL | 住所1 |
| address_line2 | text | YES | NULL | 住所2 |
| business_hours | jsonb | YES | NULL | 営業時間 |
| consultation_hours | jsonb | YES | NULL | 相談受付時間 |
| license_number | text | YES | NULL | 薬局開設許可番号 |
| owner_name | text | YES | NULL | 開設者名 |
| images | jsonb | YES | NULL | 店舗画像 |
| description | text | YES | NULL | 店舗説明 |

### vendor_staff_roles
薬局スタッフの役割を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 薬局ID |
| user_id | uuid | NO | NULL | ユーザーID（auth.usersのID） |
| role | text | NO | 'staff' | 役割（owner/staff/pharmacist） |
| status | text | NO | 'active' | ステータス（active/inactive/suspended） |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### pharmacist_certifications
薬剤師資格情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| staff_role_id | uuid | NO | NULL | スタッフロールID |
| license_number | text | NO | NULL | 薬剤師免許番号 |
| license_image_url | text | YES | NULL | 免許証画像URL |
| verification_status | text | NO | 'pending' | 確認状態（pending/verified/rejected） |
| verified_at | timestamptz | YES | NULL | 確認日時 |
| verified_by | uuid | YES | NULL | 確認した管理者ID |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

## 配送設定関連テーブル

### shipping_settings
配送設定を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 薬局ID |
| name | text | NO | NULL | 配送方法名 |
| base_fee | integer | NO | NULL | 基本送料 |
| free_shipping_threshold | integer | YES | NULL | 送料無料閾値 |
| is_active | boolean | YES | true | 有効フラグ |

### regional_shipping_fees
地域別送料を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| shipping_setting_id | uuid | YES | NULL | 配送設定ID |
| prefecture | text | NO | NULL | 都道府県 |
| additional_fee | integer | NO | NULL | 追加送料 

# Users Table

| Column Name | Type | Nullable | Default | Description |
|------------|------|----------|----------|-------------|
| id | UUID | false | | ユーザーID |
| name | TEXT | false | | ユーザー名 |
| email | TEXT | false | | メールアドレス |
| phone_number | TEXT | true | | 電話番号 |
| user_type | TEXT | false | 'end_user' | ユーザータイプ（'end_user' または 'vendor_staff'） |
| created_at | TIMESTAMPTZ | false | now() | 作成日時 |
| updated_at | TIMESTAMPTZ | false | now() | 更新日時 |

## Constraints
- PRIMARY KEY (id)
- UNIQUE (email)
- CHECK (user_type IN ('end_user', 'vendor_staff')) 