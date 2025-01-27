"use client";

import Image from "next/image";
import { useState } from "react";

export default function CorporatePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div>
      {/* ヘッダーナビゲーション */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <Image
                src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
                alt="Healthle"
                width={36}
                height={36}
                className="w-[36px] h-[36px]"
              />
              <span className="text-lg font-bold text-primary">
                Healthle
              </span>
            </div>
            {/* デスクトップナビゲーション */}
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="/corporate/for-drugstore" 
                className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm font-medium"
              >
                ドラッグストア・薬局向けサービス
              </a>
              <a 
                href="/corporate/contact" 
                className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors duration-200"
              >
                お問い合わせ
              </a>
            </nav>
            {/* ハンバーガーメニューボタン */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-5 relative flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-full h-0.5 bg-gray-600 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`w-full h-0.5 bg-gray-600 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>
        {/* モバイルメニュー */}
        <div className={`md:hidden absolute w-full bg-white/95 backdrop-blur-md transition-all duration-300 ${isMenuOpen ? 'max-h-64 border-b border-gray-100' : 'max-h-0 overflow-hidden'}`}>
          <nav className="flex flex-col px-4 py-4 gap-4">
            <a 
              href="/corporate/for-drugstore" 
              className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm font-medium py-2"
            >
              ドラッグストア・薬局向けサービス
            </a>
            <a 
              href="/corporate/contact" 
              className="text-primary hover:text-primary/90 transition-colors duration-200 text-sm font-medium py-2"
            >
              お問い合わせ
            </a>
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="relative min-h-[60vh] md:h-screen flex items-center py-20 md:py-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/40 z-10" />
        <div className="absolute inset-0">
          <Image
            src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/haikei.webp"
            alt="医療×テクノロジー"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-6xl font-bold text-white tracking-wider relative inline-block whitespace-nowrap">
              健康寿命の延伸に貢献する
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30 transform -skew-x-12"></div>
            </h2>
            <div className="w-20 h-0.5 bg-white/50 mx-auto transform rotate-90 hidden md:block"></div>
            <p className="text-base md:text-2xl text-white/90 font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              誰もが主体的に健康を築ける社会を目指して
            </p>
          </div>
        </div>
      </section>

      {/* ミッション・ビジョン */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 relative inline-block">
              Mission & Vision
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20"></div>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary/10 rounded-full"></div>
              <div className="bg-white rounded-xl shadow-lg p-10 relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z M9 10h6 M9 14h6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">ミッション</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  私たちは、日常のあらゆる不調や悩みに対して、必要な情報を提供し、その後のアクションまでをワンストップでサポートすることで、
                  <span className="text-primary font-semibold">健康寿命の延伸に貢献</span>
                  します。
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full"></div>
              <div className="bg-white rounded-xl shadow-lg p-10 relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">ビジョン</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  私たちは、誰もが不安や制約にとらわれず、主体的に健康を築ける社会を実現し、
                  <span className="text-primary font-semibold">一人ひとりが自分らしく長く活躍できる未来</span>
                  を創造します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* サービス紹介 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 relative inline-block">
              Services
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20"></div>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {/* 生活者向けサービス */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-48 md:h-64">
                <Image
                  src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/endusereapp.png?t=2025-01-18T03%3A10%3A15.109Z"
                  alt="生活者様向けアプリ画面"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  生活者向けサービス
                </h3>
                <p className="text-gray-700 mb-6">
                  日々のお悩みに合わせた情報提供や一般用医薬品の購入までを、AIを活用したアプリで、あなたの毎日をサポートします。
                </p>
                <a
                  href="/"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
                >
                  サービスを体験する
                </a>
              </div>
            </div>

            {/* ドラッグストア向けサービス */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-48 md:h-64">
                <Image
                  src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/vendorapp.png"
                  alt="ドラッグストア・薬局向けアプリ画面"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  ドラッグストア・薬局向けサービス
                </h3>
                <p className="text-gray-700 mb-6">
                  データ駆動型の在庫管理と効率的な販売機会の創出で、あなたのビジネスを成長させます。
                </p>
                <a
                  href="/corporate/for-drugstore"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
                >
                  詳しく見る
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 経営陣紹介 */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 relative inline-block">
              Management
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20"></div>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16">
            {/* CEO プロフィール */}
            <div className="bg-white rounded-2xl shadow-lg p-8 relative">
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary/10 rounded-full"></div>
              <div className="relative w-64 h-64 mb-8 mx-auto">
                <Image
                  src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/hagino.png?t=2025-01-18T01%3A53%3A11.245Z"
                  alt="萩野 颯太"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              </div>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-2xl font-bold text-gray-900">萩野 颯太</h3>
                  <p className="text-primary font-medium">ヘルスル株式会社 代表取締役CEO</p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  ヘルスル株式会社の代表取締役CEOとして、科学的根拠に基づいた健康改善サービスを提供。高校時代には全国高校選抜テニス大会での優勝経験があり、アスリートとしての視点から体調管理や睡眠の重要性を深く探求。外資系のコンサルティングファームでのテクノロジー分野の経験やヘルスケアアプリ開発の実績を活かし、AIや最新技術を用いた健康管理や、専門書や科学論文を基にした信頼性の高い情報発信を通じて、医学的根拠に基づいたヘルスケアを推進。
                </p>
              </div>
            </div>
            {/* Director プロフィール */}
            <div className="bg-white rounded-2xl shadow-lg p-8 relative">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full"></div>
              <div className="relative w-64 h-64 mb-8 mx-auto">
                <Image
                  src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/satou.png?t=2025-01-18T01%3A53%3A16.269Z"
                  alt="佐藤 亘"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 256px"
                />
              </div>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="text-2xl font-bold text-gray-900">佐藤 亘</h3>
                  <p className="text-primary font-medium">ヘルスル株式会社 取締役</p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  ヘルスケア領域のスタートアップ・株式会社エムボックスにて約4年間、マーケティング責任者として一般用医薬品の販売促進および新商品開発に従事。消費者インサイトの深掘りや市場データ分析をもとに商品戦略を立案し、実行までを一貫してリードした。データドリブンなアプローチとユーザーファーストの考え方で売上拡大やブランド認知向上に大きく貢献。現在はヘルスル株式会社にて取締役を務め、これまでの知見を活かしたマーケティング戦略の策定やビジネス開発を推進。より多くの人々に科学的根拠に基づくヘルスケアを届けることをミッションに、サービスの普及と社会的価値の創出に注力。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 会社概要 */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 relative inline-block">
              Company
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20"></div>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-3 py-4 px-6">
                  <dt className="text-gray-600">会社名</dt>
                  <dd className="col-span-2 text-gray-900">ヘルスル株式会社</dd>
                </div>
                <div className="grid grid-cols-3 py-4 px-6">
                  <dt className="text-gray-600">設立</dt>
                  <dd className="col-span-2 text-gray-900">2025年1月</dd>
                </div>
                <div className="grid grid-cols-3 py-4 px-6">
                  <dt className="text-gray-600">代表者</dt>
                  <dd className="col-span-2 text-gray-900">代表取締役CEO 萩野 颯太</dd>
                </div>
                <div className="grid grid-cols-3 py-4 px-6">
                  <dt className="text-gray-600">所在地</dt>
                  <dd className="col-span-2 text-gray-900">〒251-0045 神奈川県藤沢市</dd>
                </div>
                <div className="grid grid-cols-3 py-4 px-6">
                  <dt className="text-gray-600">事業内容</dt>
                  <dd className="col-span-2 text-gray-900">
                    <ul className="list-disc list-inside space-y-2">
                      <li>ヘルスケアプラットフォームの開発・運営</li>
                      <li>医薬品ECサイトの運営</li>
                      <li>健康相談サービスの提供</li>
                    </ul>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 