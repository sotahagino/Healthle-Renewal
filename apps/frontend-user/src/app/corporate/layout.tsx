"use client";

import { Noto_Sans_JP, Roboto } from "next/font/google";
import Image from "next/image";
import { useState } from "react";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={`${notoSansJP.variable} ${roboto.variable} font-sans min-h-screen bg-gray-50`}
    >
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

      <main className="pt-20">{children}</main>

      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">サービス</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-sm text-gray-600 hover:text-primary transition-colors">
                    生活者様向けサービス
                  </a>
                </li>
                <li>
                  <a href="/corporate/for-drugstore" className="text-sm text-gray-600 hover:text-primary transition-colors">
                    ドラッグストア・薬局向けサービス
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">メディア</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/media" className="text-sm text-gray-600 hover:text-primary transition-colors">
                    健康・医療情報
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">お問い合わせ</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/corporate/contact" className="text-sm text-gray-600 hover:text-primary transition-colors">
                    お問い合わせフォーム
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Healthle Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 