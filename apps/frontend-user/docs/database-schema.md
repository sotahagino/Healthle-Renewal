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
|---------|----------|-----------|--------------|------|
| id | uuid | NO | gen_random_uuid() | 問診ID |
| user_id | uuid | YES | - | ユーザーID |
| guest_user_id | uuid | YES | - | ゲストユーザーID |
| symptom_text | text | YES | - | 症状テキスト |
| questions | jsonb | YES | - | 質問情報 |
| answers | jsonb | YES | - | 回答情報 |
| ai_response_text | text | YES | - | AI回答テキスト |
| status | text | YES | 'pending' | ステータス |
| matched_categories | jsonb | YES | '[]' | マッチしたカテゴリ |
| is_child | boolean | YES | false | 小児フラグ |
| created_at | timestamp with time zone | YES | now() | 作成日時 |
| updated_at | timestamp with time zone | YES | now() | 更新日時 |

### urgency_assessments
緊急度評価を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|-----------|--------------|------|
| id | integer | NO | nextval | 評価ID |
| interview_id | uuid | YES | - | 問診ID |
| category_id | integer | YES | - | カテゴリID |
| matched_question_ids | ARRAY | YES | - | マッチした質問ID |
| urgency_level | varchar | NO | - | 緊急度レベル |
| recommended_departments | ARRAY | YES | - | 推奨診療科 |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 作成日時 |

### symptom_categories
症状カテゴリを管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|-----------|--------------|------|
| id | integer | NO | nextval | カテゴリID |
| category_code | varchar | NO | - | カテゴリコード |
| name | text | NO | - | カテゴリ名 |
| description | text | YES | - | 説明 |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 更新日時 |

### urgency_questions
緊急度質問を管理するテーブル

| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|-----------|--------------|------|
| id | integer | NO | nextval | 質問ID |
| category_id | integer | YES | - | カテゴリID |
| question_text | text | NO | - | 質問テキスト |
| urgency_level | varchar | NO | - | 緊急度レベル |
| recommended_departments | ARRAY | YES | - | 推奨診療科 |
| display_order | integer | NO | - | 表示順序 |
| is_escalator | boolean | YES | false | エスカレーターフラグ |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP | 更新日時 |

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

## 医療機関関連テーブル

### facilities（医療機関情報）
| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|-----------|--------------|------|
| id | text | NO | - | 医療機関ID |
| official_name | text | NO | - | 医療機関名 |
| address | text | YES | - | 住所 |
| latitude | numeric | YES | - | 緯度 |
| longitude | numeric | YES | - | 経度 |
| homepage | text | YES | - | ホームページURL |
| prefecture_code | text | YES | - | 都道府県コード |
| city_code | text | YES | - | 市区町村コード |
| is_open_mon | boolean | YES | - | 月曜日営業フラグ |
| is_open_tue | boolean | YES | - | 火曜日営業フラグ |
| is_open_wed | boolean | YES | - | 水曜日営業フラグ |
| is_open_thu | boolean | YES | - | 木曜日営業フラグ |
| is_open_fri | boolean | YES | - | 金曜日営業フラグ |
| is_open_sat | boolean | YES | - | 土曜日営業フラグ |
| is_open_sun | boolean | YES | - | 日曜日営業フラグ |

### departments（診療科情報）
| カラム名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|---------|----------|-----------|--------------|------|
| department_id | integer | NO | nextval | 診療科ID |
| facility_id | text | NO | - | 医療機関ID |
| department_code | text | YES | - | 診療科コード |
| department_name | text | NO | - | 診療科名 |
| time_slot | integer | YES | - | 診療時間枠 |
| mon_start | time | YES | - | 月曜日開始時間 |
| mon_end | time | YES | - | 月曜日終了時間 |
| tue_start | time | YES | - | 火曜日開始時間 |
| tue_end | time | YES | - | 火曜日終了時間 |
| wed_start | time | YES | - | 水曜日開始時間 |
| wed_end | time | YES | - | 水曜日終了時間 |
| thu_start | time | YES | - | 木曜日開始時間 |
| thu_end | time | YES | - | 木曜日終了時間 |
| fri_start | time | YES | - | 金曜日開始時間 |
| fri_end | time | YES | - | 金曜日終了時間 |
| sat_start | time | YES | - | 土曜日開始時間 |
| sat_end | time | YES | - | 土曜日終了時間 |
| sun_start | time | YES | - | 日曜日開始時間 |
| sun_end | time | YES | - | 日曜日終了時間 | 