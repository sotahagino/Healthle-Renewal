# Healthle 薬局向けデータベーススキーマ

## 薬局関連テーブル

### vendors
薬局情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_name | text | YES | NULL | 薬局名 |
| company_name | text | YES | NULL | 会社名 |
| status | text | YES | NULL | ステータス |
| email | text | YES | NULL | メールアドレス |
| phone | text | YES | NULL | 電話番号 |
| fax | text | YES | NULL | FAX番号 |
| postal_code | text | YES | NULL | 郵便番号 |
| prefecture | text | YES | NULL | 都道府県 |
| city | text | YES | NULL | 市区町村 |
| address_line1 | text | YES | NULL | 住所1 |
| address_line2 | text | YES | NULL | 住所2 |
| business_hours | jsonb | YES | NULL | 営業時間 |
| consultation_hours | jsonb | YES | NULL | 相談受付時間 |
| license_number | text | YES | NULL | 薬局開設許可番号 |
| owner_name | text | YES | NULL | 開設者名 |
| store_manager | text | YES | NULL | 店舗運営責任者 |
| security_manager | text | YES | NULL | 店舗セキュリティ責任者 |
| handling_categories | text[] | YES | NULL | 取扱医薬品区分 |
| images | jsonb | YES | NULL | 店舗画像 |
| store_images | jsonb | YES | NULL | 店舗写真（外観・内部） |
| description | text | YES | NULL | 店舗説明 |

### vendor_licenses
薬局の許可情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 薬局ID |
| license_type | text | NO | NULL | 許可区分（店舗販売業など） |
| license_number | text | NO | NULL | 許可番号 |
| issue_date | date | NO | NULL | 発行年月日 |
| valid_from | date | NO | NULL | 有効期限開始 |
| valid_until | date | NO | NULL | 有効期限終了 |
| license_holder_name | text | NO | NULL | 許可証の名義人 |
| issuing_authority | text | NO | NULL | 許可証発行自治体名 |

### vendor_online_sales_notifications
インターネット販売届出情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 薬局ID |
| notification_date | date | NO | NULL | 届出年月日 |
| notification_authority | text | NO | NULL | 届出先 |

### vendor_professionals
専門家（薬剤師・登録販売者）情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 薬局ID |
| name | text | NO | NULL | 氏名 |
| qualification_type | text | NO | NULL | 資格の種類（薬剤師/登録販売者） |
| registration_number | text | NO | NULL | 登録番号 |
| registration_prefecture | text | NO | NULL | 登録先都道府県 |
| is_manager | boolean | YES | false | 管理者フラグ |
| responsibilities | text[] | YES | NULL | 担当業務 |
| work_schedule | jsonb | YES | NULL | 勤務状況 |

### vendor_business_hours
営業時間情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 薬局ID |
| type | text | NO | NULL | 営業時間種別（実店舗/オンライン注文/専門家対応） |
| weekday | text | NO | NULL | 曜日 |
| start_time | time | NO | NULL | 開始時間 |
| end_time | time | NO | NULL | 終了時間 |
| break_start_time | time | YES | NULL | 休憩開始時間 |
| break_end_time | time | YES | NULL | 休憩終了時間 |

### vendor_emergency_contacts
緊急連絡先情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| vendor_id | uuid | YES | NULL | 薬局ID |
| type | text | NO | NULL | 連絡先種別（通常/緊急） |
| phone | text | YES | NULL | 電話番号 |
| email | text | YES | NULL | メールアドレス |
| available_hours | jsonb | YES | NULL | 対応可能時間 |

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
| category | text | YES | NULL | カテゴリー |
| price | integer | YES | NULL | 価格 |
| status | text | YES | NULL | 商品ステータス |
| purchase_limit | integer | YES | NULL | 購入制限数 |
| requires_questionnaire | boolean | YES | false | 問診必須フラグ |
| stock_quantity | integer | YES | 0 | 在庫数 |
| stock_status | text | YES | 'in_stock' | 在庫ステータス |
| medicine_type | text | YES | NULL | 医薬品分類 |
| ingredients | jsonb | YES | NULL | 成分情報 |
| effects | text | YES | NULL | 効能・効果 |
| usage_instructions | text | YES | NULL | 用法・用量 |
| package_insert | jsonb | YES | NULL | 添付文書情報 |
| precautions | text | YES | NULL | 注意事項 |
| requires_pharmacist_consultation | boolean | YES | false | 薬剤師による情報提供義務の有無 |
| shipping_info | jsonb | YES | NULL | 配送情報 |
| stripe_price_id | varchar | YES | NULL | Stripe価格ID |
| stripe_payment_link_url | text | YES | NULL | Stripe決済リンクURL |
| stripe_payment_link_id | varchar | YES | NULL | Stripe決済リンクID |
| created_at | timestamptz | YES | now() | 作成日時 |
| updated_at | timestamptz | YES | now() | 更新日時 |

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
| commission_rate | integer | YES | NULL | 手数料率 |
| shipping_info | jsonb | YES | NULL | 配送情報 |
| customer_email | varchar | YES | NULL | 顧客メールアドレス |
| shipping_address | text | YES | NULL | 配送先住所 |
| shipping_name | text | YES | NULL | 配送先名 |
| shipping_phone | text | YES | NULL | 配送先電話番号 |
| consultation_id | uuid | YES | NULL | 相談ID |
| interview_id | uuid | YES | NULL | 問診ID |
| pharmacist_confirmation_status | text | YES | 'pending' | 薬剤師確認状態 |
| pharmacist_confirmation_at | timestamptz | YES | NULL | 薬剤師確認日時 |
| pharmacist_id | uuid | YES | NULL | 確認薬剤師ID |
| shipping_method_id | uuid | YES | NULL | 配送方法ID |
| shipping_fee | integer | YES | NULL | 送料 |
| tracking_number | text | YES | NULL | 追跡番号 |
| estimated_delivery_date | date | YES | NULL | 配送予定日 |
| actual_delivery_date | date | YES | NULL | 実際の配送完了日 |
| cancellation_reason | text | YES | NULL | キャンセル理由 |
| return_reason | text | YES | NULL | 返品理由 |
| return_status | text | YES | NULL | 返品ステータス |
| notes | text | YES | NULL | 備考 |
| stripe_session_id | varchar | YES | NULL | Stripeセッションid |
| stripe_payment_intent_id | varchar | YES | NULL | Stripe支払いインテントID |
| created_at | timestamptz | YES | now() | 作成日時 |
| updated_at | timestamptz | YES | now() | 更新日時 |

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

## 管理者関連テーブル

### admin_users
管理者情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| email | text | YES | NULL | メールアドレス |
| password_hash | text | YES | NULL | パスワードハッシュ |
| role | text | YES | NULL | 役割 |
| name | text | YES | NULL | 名前 |
| user_id | uuid | YES | gen_random_uuid() | ユーザーID |
| created_at | timestamptz | YES | now() | 作成日時 |
| updated_at | timestamptz | YES | now() | 更新日時 |

## 問診関連テーブル

### medical_interviews
問診情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| user_id | uuid | YES | NULL | ユーザーID |
| guest_user_id | uuid | YES | NULL | ゲストユーザーID |
| symptom_text | text | YES | NULL | 症状テキスト |
| questions | jsonb | YES | NULL | 質問リスト |
| answers | jsonb | YES | NULL | 回答リスト |
| ai_response_text | text | YES | NULL | AI応答テキスト |
| status | text | YES | 'pending' | ステータス |
| conversation_id | text | YES | NULL | 会話ID |
| last_response_at | timestamptz | YES | NULL | 最終応答日時 |
| created_at | timestamptz | YES | now() | 作成日時 |
| updated_at | timestamptz | YES | now() | 更新日時 |

### interview_conversations
問診会話を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| interview_id | uuid | YES | NULL | 問診ID |
| question | text | NO | NULL | 質問 |
| answer | text | YES | NULL | 回答 |
| created_at | timestamptz | YES | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | timestamptz | YES | CURRENT_TIMESTAMP | 更新日時 |

### interview_recommendations
問診に基づく推奨商品を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| interview_id | uuid | YES | NULL | 問診ID |
| recommended_products | jsonb | YES | NULL | 推奨商品リスト |
| created_at | timestamptz | YES | CURRENT_TIMESTAMP | 作成日時 |

## ユーザー関連テーブル

### user_profiles
ユーザープロフィール情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| email | varchar | NO | NULL | メールアドレス |
| name | varchar | YES | NULL | 名前 |
| phone | varchar | YES | NULL | 電話番号 |
| postal_code | varchar | YES | NULL | 郵便番号 |
| prefecture | varchar | YES | NULL | 都道府県 |
| city | varchar | YES | NULL | 市区町村 |
| address_line1 | varchar | YES | NULL | 住所1 |
| address_line2 | varchar | YES | NULL | 住所2 |
| full_address | text | YES | NULL | 完全な住所 |
| is_guest | boolean | YES | false | ゲストユーザーフラグ |
| created_at | timestamptz | YES | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | timestamptz | YES | CURRENT_TIMESTAMP | 更新日時 | 