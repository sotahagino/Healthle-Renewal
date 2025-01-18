import Image from "next/image";

export default function ForDrugstorePage() {
  return (
    <div className="bg-white">
      {/* ヘッダー */}
      <div className="bg-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white text-center">
          ドラッグストア・薬局向けサービス
          </h1>
        </div>
      </div>

      {/* プラットフォーム概要 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            プラットフォーム概要
          </h2>
          <div className="max-w-3xl mx-auto text-gray-700">
            <p className="mb-6">
              Healthleは、最新のテクノロジーを活用した医薬品ECプラットフォームです。
              データ駆動型の在庫管理と効率的な販売機会の創出により、ドラッグストアの業務効率化と売上向上を支援します。
            </p>
            <div className="aspect-w-16 aspect-h-9 mb-8">
              <Image
                src="/images/corporate/platform-overview.jpg"
                alt="プラットフォーム概要"
                width={800}
                height={450}
                className="rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 導入メリット */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            導入メリット
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {/* 売上拡大機会 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-primary mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                売上拡大機会
              </h3>
              <p className="text-gray-700">
                全国の顧客にリーチ可能なオンラインチャネルを通じて、新たな販売機会を創出します。
                AIによる商品レコメンドで、効果的なクロスセルも実現します。
              </p>
            </div>

            {/* 効率的な在庫管理 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-primary mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                効率的な在庫管理
              </h3>
              <p className="text-gray-700">
                リアルタイムの在庫管理システムと需要予測により、
                適切な在庫水準を維持し、機会損失を防ぎます。
              </p>
            </div>

            {/* データ活用 */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-primary mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                データ活用
              </h3>
              <p className="text-gray-700">
                販売データの分析により、商品構成の最適化や
                効果的なプロモーション戦略の立案をサポートします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 機能一覧 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            機能一覧
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  在庫管理システム
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>リアルタイム在庫管理</li>
                  <li>自動発注システム</li>
                  <li>在庫アラート機能</li>
                  <li>バーコード管理</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  販売管理システム
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>受注管理</li>
                  <li>売上レポート</li>
                  <li>顧客管理</li>
                  <li>決済管理</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  マーケティング支援
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>商品レコメンド機能</li>
                  <li>プロモーション管理</li>
                  <li>顧客分析レポート</li>
                  <li>メール配信機能</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* お問い合わせ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              お問い合わせ
            </h2>
            <p className="text-gray-700 mb-8">
              Healthleの導入についてのご質問や詳細な資料のご請求は、
              以下のフォームよりお気軽にお問い合わせください。
            </p>
            <a
              href="/corporate/contact"
              className="inline-block bg-primary text-white px-8 py-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              お問い合わせフォームへ
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 