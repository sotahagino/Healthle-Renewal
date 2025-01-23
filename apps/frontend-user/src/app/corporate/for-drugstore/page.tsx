"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function ForDrugstorePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const fadeInUp = (delay = 0) =>
    `opacity-0 translate-y-8 transition-all duration-700 delay-${delay} ${
      isVisible ? "opacity-100 translate-y-0" : ""
    }`;

  return (
    <div className="bg-white">
      {/* ヘッダー */}
      <div className="relative bg-primary py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80" />
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
              ドラッグストア・薬局向けサービス
            </h1>
            <p className="text-lg md:text-2xl text-white/90 font-medium leading-relaxed mb-12">
              健康相談から始まる、新しい購買体験を提供する次世代型ECプラットフォーム
            </p>
            <div className="mt-12">
              <a
                href="#contact"
                className="inline-flex items-center px-12 py-5 text-lg font-medium rounded-full text-primary bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                無料で始める
                <svg className="ml-3 -mr-1 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 text-white" preserveAspectRatio="none" viewBox="0 0 1440 48">
            <path
              fill="currentColor"
              d="M0 48h1440V0c-624 23-936 24-1440 0z"
            />
          </svg>
        </div>
      </div>

      {/* プラットフォーム概要 */}
      <section className="py-20" id="platform-overview" data-animate>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isVisible["platform-overview"] ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              プラットフォーム概要
            </h2>
            <p className="text-lg text-gray-700 text-center mb-16 leading-relaxed">
              "不調時の新たな入口"となるヘルスケアプラットフォームを目指し、<br />
              健康に寄り添ったサービスを提供。<br />
              AIやデジタル技術を活用し、出店者様と消費者双方に新たな価値を提供。<br />
              健康市場での新しいEC体験をともに築きましょう。
            </p>
            <div className="grid gap-8 mt-12">
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      AIネイティブのECモール（健康特化型）
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      他のECモールとは異なり、健康相談から始まる購買体験を提供。
                      健康に関心の高い顧客層をターゲットとし、出店者の商品がより効果的に届く仕組みを実現しています。
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      競合優位性
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>競合しないポジション：既存ECモールの前段階のニーズを汲み取り</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>価格競争を防止：健康相談機能を活用し、価格競争が起こりにくい環境</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>新たなニーズの創出：潜在層から顕在層まで顧客ニーズを引き出し</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      実績
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      商品リンクのクリック率（CTAR）やコンバージョン率（CVR）は、大手ECモールのトップ店舗並みの高さを誇ります。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 導入メリット */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50" id="benefits" data-animate>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isVisible["benefits"] ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              導入メリット
            </h2>
            <div className="w-20 h-1 bg-primary/20 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 売上拡大機会 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-primary"
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                売上拡大機会
              </h3>
              <p className="text-gray-700 text-center leading-relaxed">
                全国の顧客にリーチ可能なオンラインチャネルを通じて、新たな販売機会を創出。
                AIによる商品レコメンドで、効果的なクロスセルも実現します。
              </p>
            </div>

            {/* 簡単な在庫管理 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-primary"
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                簡単な在庫管理
              </h3>
              <p className="text-gray-700 text-center leading-relaxed">
                直感的な操作で商品登録や在庫管理が可能。
                エリアごとや段ボールサイズに応じた配送設定など、
                柔軟な運用をサポートします。
              </p>
            </div>

            {/* データ分析・レポート */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-primary"
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                データ分析・レポート
              </h3>
              <p className="text-gray-700 text-center leading-relaxed">
                月別、日別、時間帯別の詳細な売上データを提供。
                顧客分析レポートや精算管理機能で、
                効率的な店舗運営をサポートします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 機能一覧 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            提供機能
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  24時間365日サポート
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>電話・チャットでいつでも相談可能</li>
                  <li>必要に応じて一部の設定や作業を代行</li>
                  <li>AIチャットサポートによる即時対応</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  店舗運営機能
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>商品管理：簡単な商品登録や在庫管理</li>
                  <li>配送設定：配送・出荷の設定を直感的に操作</li>
                  <li>店舗運営：店舗の基本設定やカスタマイズ</li>
                  <li>顧客対応：問い合わせの効率的な対応をサポート</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  データ分析・レポート
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>受注/売上分析</li>
                  <li>月別、日別、時帯別の詳細なデータ提供</li>
                  <li>顧客分析レポート</li>
                  <li>精算管理および精算書の出力</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white" id="pricing" data-animate>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isVisible["pricing"] ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              料金プラン
            </h2>
            <div className="w-20 h-1 bg-primary/20 mx-auto"></div>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full transform translate-x-20 -translate-y-20"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-full transform -translate-x-20 translate-y-20"></div>
              <div className="relative">
                <div className="text-center mb-12">
                  <span className="inline-block px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                    期間限定キャンペーン
                  </span>
                  <p className="text-6xl font-bold text-primary mb-4 flex items-center justify-center">
                    <span className="text-2xl mr-2">初期費用</span>
                    0円
                  </p>
                  <p className="text-gray-600">※2025年4月以降は初期費用100,000円～に変更予定</p>
                </div>
                <div className="space-y-10">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">基本料金</h3>
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8">
                      <p className="text-2xl font-bold text-center">販売手数料: 8%</p>
                      <p className="text-gray-600 text-center mt-2">※決済手数料3%を含む</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">含まれる機能</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center space-x-3">
                        <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">商品管理システム</span>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center space-x-3">
                        <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">在庫管理システム</span>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center space-x-3">
                        <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">売上分析ツール</span>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center space-x-3">
                        <svg className="w-6 h-6 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">24時間365日サポート</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <a
                    href="#contact"
                    className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full text-white bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    今すぐ始める
                    <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* よくある質問 */}
      <section className="py-20" id="faq" data-animate>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isVisible["faq"] ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            よくある質問
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  出店のための審査や条件はありますか？
                </h3>
                <p className="text-gray-700">
                  店舗販売業に関する許可等の審査を行います。
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  複数ストアを出店することは可能ですか？
                </h3>
                <p className="text-gray-700">
                  単一ストアのみの出店になります。単一ストアでも多くの売り上げが見込めます。
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  商品発送時の送料はどのように決まりますか？
                </h3>
                <p className="text-gray-700">
                  送料は各ショップ様にて設定頂きます。エリア毎や段ボールのサイズの設定が可能です。
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  運営で困ったときはどうすればよいですか？
                </h3>
                <p className="text-gray-700">
                  AIチャットサポートと人力による支援があります。カスタマーサポートは営業時間内の電話・チャットでの対応が可能です。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* お問い合わせ */}
      <section className="py-20 bg-gray-50" id="contact" data-animate>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isVisible["contact"] ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}>
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