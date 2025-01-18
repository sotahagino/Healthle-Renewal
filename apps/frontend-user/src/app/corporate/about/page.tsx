"use client";

import Image from "next/image";
import { useState } from "react";

export default function AboutPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white">
      {/* ヘッダーナビゲーション */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <a href="/corporate" className="flex items-center gap-2">
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
              </a>
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
                href="#contact" 
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
              href="#contact" 
              className="text-primary hover:text-primary/90 transition-colors duration-200 text-sm font-medium py-2"
            >
              お問い合わせ
            </a>
          </nav>
        </div>
      </header>

      <div className="pt-20 bg-gray-50">
        {/* 会社概要 */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-gray-900 mb-6 relative inline-block">
                会社概要
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/20"></div>
              </h2>
            </div>
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
              <dl className="divide-y divide-gray-100">
                <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <dt className="font-bold text-gray-900">会社名</dt>
                  <dd className="text-gray-700 md:col-span-2">ヘルスル株式会社</dd>
                </div>
                <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <dt className="font-bold text-gray-900">代表者</dt>
                  <dd className="text-gray-700 md:col-span-2">代表取締役CEO 萩野颯太</dd>
                </div>
                <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <dt className="font-bold text-gray-900">設立</dt>
                  <dd className="text-gray-700 md:col-span-2">2025年1月</dd>
                </div>
                <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <dt className="font-bold text-gray-900">事業内容</dt>
                  <dd className="text-gray-700 md:col-span-2">
                    <div className="space-y-2">
                      <p>医療・健康情報プラットフォームの運営</p>
                      <p>一般用医薬品のEモール事業</p>
                    </div>
                  </dd>
                </div>
                <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <dt className="font-bold text-gray-900">所在地</dt>
                  <dd className="text-gray-700 md:col-span-2">
                    〒251-0045<br />
                    神奈川県藤沢市辻堂東海岸3-6-17
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 