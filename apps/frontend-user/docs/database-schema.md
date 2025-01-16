# Healthle データベーススキーマ

## ユーザー関連テーブル

### users
認証とユーザー基本情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| email | text | YES | NULL | メールアドレス |
| name | text | YES | NULL | ユーザー名 |
| phone_number | text | YES | NULL | 電話番号 |
| postal_code | text | YES | NULL | 郵便番号 |
| prefecture | text | YES | NULL | 都道府県 |
| city | text | YES | NULL | 市区町村 |
| address_line1 | text | YES | NULL | 住所1 |
| address_line2 | text | YES | NULL | 住所2 |
| birthdate | date | YES | NULL | 生年月日 |
| stripe_customer_id | text | YES | NULL | Stripe顧客ID |
| is_anonymous | boolean | NO | false | 匿名ユーザーフラグ |

### user_profiles
ユーザーの詳細プロフィール情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| email | varchar | NO | NULL | メールアドレス |
| name | varchar | YES | NULL | 氏名 |
| phone | varchar | YES | NULL | 電話番号 |
| postal_code | varchar | YES | NULL | 郵便番号 |
| prefecture | varchar | YES | NULL | 都道府県 |
| city | varchar | YES | NULL | 市区町村 |
| address_line1 | varchar | YES | NULL | 住所1 |
| address_line2 | varchar | YES | NULL | 住所2 |
| is_guest | boolean | YES | false | ゲストユーザーフラグ |

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

## 医療問診関連テーブル

### medical_interviews
問診情報を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| user_id | uuid | YES | NULL | ユーザーID |
| guest_user_id | uuid | YES | NULL | ゲストユーザーID |
| symptom_text | text | YES | NULL | 症状テキスト |
| questions | jsonb | YES | NULL | 質問情報 |
| answers | jsonb | YES | NULL | 回答情報 |
| status | text | YES | 'pending' | 問診ステータス |
| ai_response_text | text | YES | NULL | AI回答テキスト |
| created_at | timestamp with time zone | YES | now() | 作成日時 |
| updated_at | timestamp with time zone | YES | now() | 更新日時 |
| question_1 | text | YES | NULL | 質問1 |
| question_2 | text | YES | NULL | 質問2 |
| question_3 | text | YES | NULL | 質問3 |
| question_4 | text | YES | NULL | 質問4 |
| question_5 | text | YES | NULL | 質問5 |
| question_6 | text | YES | NULL | 質問6 |
| question_7 | text | YES | NULL | 質問7 |
| question_8 | text | YES | NULL | 質問8 |
| question_9 | text | YES | NULL | 質問9 |
| question_10 | text | YES | NULL | 質問10 |
| answer_1 | text | YES | NULL | 回答1 |
| answer_2 | text | YES | NULL | 回答2 |
| answer_3 | text | YES | NULL | 回答3 |
| answer_4 | text | YES | NULL | 回答4 |
| answer_5 | text | YES | NULL | 回答5 |
| answer_6 | text | YES | NULL | 回答6 |
| answer_7 | text | YES | NULL | 回答7 |
| answer_8 | text | YES | NULL | 回答8 |
| answer_9 | text | YES | NULL | 回答9 |
| answer_10 | text | YES | NULL | 回答10 |
| conversation_id | text | YES | NULL | 会話ID |
| last_response_at | timestamp with time zone | YES | NULL | 最終応答日時 |

### interview_conversations
問診の会話履歴を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| interview_id | uuid | YES | NULL | 問診ID |
| question | text | NO | NULL | 質問 |
| answer | text | YES | NULL | 回答 |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 更新日時 |

### interview_recommendations
問診に基づく商品レコメンドを管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|----------|--------------|------|
| id | uuid | NO | uuid_generate_v4() | 主キー |
| interview_id | uuid | YES | NULL | 問診ID |
| recommended_products | jsonb | YES | NULL | レコメンド商品情報 |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 作成日時 | 