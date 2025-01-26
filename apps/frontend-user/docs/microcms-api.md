# Healthle microCMS API ドキュメント

## 1. 基本設定

```typescript
// 環境変数
MICROCMS_SERVICE_DOMAIN=healthle
MICROCMS_API_KEY=p5TgLuiqv9gcD1oq5zllvvXZrrAnNw0OZUP5
```

## 2. APIエンドポイント

### 2.1 記事（articles）

```typescript
type Article = {
  id: string;
  title: string;          // 記事タイトル
  description: string;    // 記事概要
  content: string;        // 記事本文（HTML）
  eyecatch?: {           // アイキャッチ画像
    url: string;
    height: number;
    width: number;
  };
  category: {            // カテゴリー
    id: string;
    title: string;
    slug: string;
  };
  tags?: {              // タグ（複数選択可）
    id: string;
    title: string;
    slug: string;
    type?: string;
  }[];
  author_name: string;   // 著者名
  author_profile?: string; // 著者プロフィール
  faq?: FaqItem[];      // FAQ
  references?: ReferenceItem[]; // 参考文献
  publishedAt: string;   // 公開日時
  updatedAt: string;     // 更新日時
  slug: string;          // URL用スラッグ
};
```

### 2.2 カテゴリー（categories）

```typescript
type Category = {
  id: string;
  title: string;         // カテゴリー名
  slug: string;          // URL用スラッグ
  description?: string;  // カテゴリーの説明
  parent_category?: Category; // 親カテゴリー
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};
```

### 2.3 タグ（tags）

```typescript
type Tag = {
  id: string;
  title: string;         // タグ名
  slug: string;          // URL用スラッグ
  type: 'symptom' | 'cause' | 'solution'; // タグの種類
  description?: string;  // タグの説明
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};
```

## 3. API利用例

### 3.1 記事の取得

```typescript
// 記事一覧の取得
const articles = await client.getList<Article>({
  endpoint: 'articles',
  queries: {
    fields: ['id', 'title', 'description', 'eyecatch', 'category', 'author_name', 'publishedAt', 'slug'],
    orders: '-publishedAt',
  },
});

// 特定の記事の取得
const article = await client.getList<Article>({
  endpoint: 'articles',
  queries: {
    filters: `slug[equals]${slug}`,
  },
});
```

### 3.2 カテゴリーの取得

```typescript
// カテゴリー一覧の取得
const categories = await client.getList<Category>({
  endpoint: 'categories',
  queries: {
    fields: ['id', 'title', 'slug', 'description', 'parent_category'],
    orders: 'title',
  },
});

// 特定のカテゴリーの記事取得
const categoryArticles = await client.getList<Article>({
  endpoint: 'articles',
  queries: {
    filters: `category[equals]${categoryId}`,
    orders: '-publishedAt',
  },
});
```

### 3.3 タグの取得

```typescript
// タグ一覧の取得
const tags = await client.getList<Tag>({
  endpoint: 'tags',
  queries: {
    fields: ['id', 'title', 'slug', 'description', 'type'],
    orders: 'title',
  },
});

// 特定のタグの記事取得
const tagArticles = await client.getList<Article>({
  endpoint: 'articles',
  queries: {
    filters: `tags[contains]${tagId}`,
    orders: '-publishedAt',
  },
});
```

### 3.4 検索機能

```typescript
// 記事の検索
const searchResults = await client.getList<Article>({
  endpoint: 'articles',
  queries: {
    q: searchQuery,      // 検索キーワード
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
    orders: '-publishedAt',
  },
});
```

## 4. コンテンツ作成のガイドライン

### 4.1 記事作成時の注意点
- スラッグは英数字とハイフンのみを使用（例：`osa-tonsil-snoring-relationship`）
- FAQの入力時は番号（Q1, A1など）は不要（自動的に付与される）
- 画像は最適化のため、適切なサイズで登録する

### 4.2 カテゴリー・タグの設定
- カテゴリーは階層構造を意識して設定
- タグは必ず種類（症状・原因・解決策）を選択
- スラッグは一意になるように設定

### 4.3 カスタムフィールドの構造

#### FAQ項目
```typescript
type FaqItem = {
  fieldId: string;
  question: string;  // 質問（番号不要）
  answer: string;    // 回答（番号不要）
};
```

#### 参考文献項目
```typescript
type ReferenceItem = {
  fieldId: string;
  text: string;     // 文献情報
  doi?: string;     // DOI（オプション）
};
```

## 5. キャッシュと再検証

- 基本的なキャッシュ時間は60秒（`revalidate = 60`）
- 記事詳細ページは即時更新（`revalidate = 0`）

## 6. エラーハンドリング

```typescript
try {
  const response = await client.getList<Article>({
    endpoint: 'articles',
    queries: {
      filters: `slug[equals]${slug}`,
    },
  });
  return response.contents[0];
} catch (error) {
  return null;
}
```

このドキュメントは必要に応じて更新していきます。 