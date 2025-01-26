# Healthle Frontend User

## 環境構築

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# microCMS設定
MICROCMS_SERVICE_DOMAIN=healthle
MICROCMS_API_KEY=your_api_key

# その他の設定
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## ドキュメント

- [microCMS API ドキュメント](./docs/microcms-api.md)

## 機能

### メディア機能

- 記事一覧表示
- カテゴリー別記事一覧
- タグ別記事一覧
- 記事検索
- パンくずリスト
- ページネーション

### コンテンツ管理（microCMS）

- 記事管理
- カテゴリー管理（階層構造対応）
- タグ管理（症状・原因・解決策）
- FAQ管理
- 参考文献管理

## ディレクトリ構造

```
frontend-user/
├── docs/               # ドキュメント
├── public/            # 静的ファイル
├── src/
│   ├── app/          # ページコンポーネント
│   ├── components/   # 共通コンポーネント
│   ├── lib/         # ユーティリティ関数
│   └── types/       # 型定義
└── README.md
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
