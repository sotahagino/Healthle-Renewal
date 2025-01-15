# Healthle 薬局向けデータベーススキーマ

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
| user_id | uuid | NO | NULL | ユーザーID |
| role | text | NO | 'staff' | 役割（staff/pharmacist） |
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

## 商品関連テーブル

### products
商品情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 販売店ID |
| name | text | YES | NULL | 商品名 |
| description | text | YES | NULL | 商品説明 |
| image_url | text | YES | NULL | 商品画像URL |
| price | integer | YES | NULL | 価格 |
| status | text | YES | NULL | 商品ステータス |
| purchase_limit | integer | YES | NULL | 購入制限数 |
| stock_quantity | integer | YES | 0 | 在庫数 |
| medicine_type | text | YES | NULL | 医薬品分類（第1類/第2類/第3類） |
| ingredients | jsonb | YES | NULL | 成分情報 |
| effects | text | YES | NULL | 効能・効果 |
| usage_instructions | text | YES | NULL | 用法・用量 |
| package_insert | jsonb | YES | NULL | 添付文書情報 |
| precautions | text | YES | NULL | 注意事項 |
| requires_pharmacist_consultation | boolean | YES | false | 薬剤師による情報提供義務の有無 |

## 注文関連テーブル

### vendor_orders
注文情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| order_id | varchar | YES | NULL | 注文番号 |
| vendor_id | uuid | YES | NULL | 販売店ID |
| product_id | uuid | YES | NULL | 商品ID |
| user_id | uuid | YES | NULL | ユーザーID |
| status | text | YES | NULL | 注文ステータス |
| total_amount | integer | YES | NULL | 合計金額 |
| shipping_fee | integer | YES | NULL | 送料 |
| shipping_method_id | uuid | YES | NULL | 配送方法ID |
| shipping_name | text | YES | NULL | 配送先名 |
| shipping_phone | text | YES | NULL | 配送先電話番号 |
| shipping_address | text | YES | NULL | 配送先住所 |
| tracking_number | text | YES | NULL | 追跡番号 |
| estimated_delivery_date | date | YES | NULL | 配送予定日 |
| actual_delivery_date | date | YES | NULL | 実際の配送完了日 |
| pharmacist_confirmation_status | text | YES | 'pending' | 薬剤師確認状態 |
| pharmacist_confirmation_at | timestamptz | YES | NULL | 薬剤師確認日時 |
| pharmacist_id | uuid | YES | NULL | 確認薬剤師ID |

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