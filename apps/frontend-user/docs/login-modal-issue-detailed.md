# Healthleアプリケーション ログインモーダル表示問題の分析依頼

## 🔍 問題の概要

### 現象
- ログイン済みユーザーに対して未ログインユーザー用のモーダルが誤って表示
- `SiteHeader`コンポーネントでは正しくログイン状態を認識
- 購入フローでは同じユーザーが未ログイン状態として判定

### 技術スタック
- **フレームワーク**: Next.js
- **認証**: Supabase Auth + LINE OAuth
- **状態管理**: ローカルステート（React useState）
- **DB**: Supabase

## 💻 コード構造

### ディレクトリ構成
```
healthle/apps/frontend-user/
├── src/
│   ├── app/
│   │   └── result/
│   │       └── page.tsx      # 問題発生箇所
│   ├── components/
│   │   ├── ui/
│   │   │   ├── dialog.tsx   # モーダル
│   │   │   └── select.tsx
│   │   └── site-header.tsx  # 正常動作
│   └── lib/
│       └── utils.ts
```

### 認証関連の実装

#### SiteHeader（正常動作）
```typescript
const [authState, setAuthState] = useState({
  user: null,
  loading: true,
});

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setAuthState({
        user: session?.user || null,
        loading: false,
      });
    }
  );

  supabase.auth.getSession().then(({ data: { session } }) => {
    setAuthState({
      user: session?.user || null,
      loading: false,
    });
  });

  return () => subscription.unsubscribe();
}, []);
```

#### 購入フロー（問題発生箇所）
```typescript
const handlePurchaseClick = async (product: RecommendedProduct) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (session?.user?.id) {
      // ログイン済み処理
    } else {
      // 未ログイン処理（ここに誤って入る）
      setIsLoggedIn(false)
      setUserStatus('unregistered')
      setIsModalOpen(true)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}
```

## 📊 現在の状態

### ログ情報
```javascript
// SiteHeaderでのログ
SiteHeader state: {
  loading: false,
  user: {
    id: '78e3450c-47c0-4a7f-8056-88b19a31e3c8',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'zlatanera1130@gmail.com',
    email_confirmed_at: '2024-12-24T04:19:41.366276Z'
  }
}

// 購入フローでのログ
Current session: null  // 期待値: セッション情報
```

### 認証フロー
1. LINE OAuthによるログイン
2. Supabaseでのユーザー作成/更新
3. セッション確立
4. 各コンポーネントでのセッション取得

## 🎯 解決したい課題

1. セッション管理の一貫性確保
2. コンポーネント間での認証状態の同期
3. 適切なタイミングでのモーダル表示判定

## 💭 仮説

### 考えられる原因
1. **非同期処理のタイミング**
   - セッション取得とモーダル表示の判定タイミングのズレ
   - useEffectの実行順序の問題

2. **状態管理の問題**
   - コンポーネント間での状態共有がない
   - ローカルステートの競合

3. **セッション管理の問題**
   - Cookieの永続化設定
   - Supabaseの設定不備

## 🛠 期待する解決策

1. **実装アプローチ**
   - グローバルステート管理の導入
   - 認証状態の一元管理
   - 適切なローディング状態の実装

2. **具体的なコード例**
   - Context APIまたはReduxでの実装例
   - カスタムフックの作成例
   - エラーハンドリングの実装

3. **検証方法**
   - デバッグログの追加位���
   - テストケースの提案

## 📝 補足情報

- Node.js version: 18.x
- Next.js version: 14.x
- Supabase Auth version: 最新
- デプロイ環境: Vercel

## ⚡ 優先度

1. 認証状態の一貫性確保（高）
2. ユーザー体験の改善（中）
3. エラーハンドリングの強化（中）
4. パフォーマンスの最適化（低） 