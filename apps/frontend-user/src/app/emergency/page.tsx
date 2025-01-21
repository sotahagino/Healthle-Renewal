"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Phone, Home } from 'lucide-react'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useRouter } from 'next/navigation'

export default function EmergencyPage() {
  const router = useRouter()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 緊急度表示セクション */}
            <div className="p-6 md:p-8 bg-red-50">
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-red-100">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold mb-3 text-red-700">
                  緊急性の高い症状があります
                </h1>
                
                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl mb-8">
                  選択された症状から判断すると、緊急性が非常に高い状態です。
                  直ちに救急車を呼び、救急医療機関を受診することを強くお勧めします。
                </p>

                {/* 119番通報ボタン */}
                <a
                  href="tel:119"
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto mb-4"
                >
                  <Phone className="w-6 h-6" />
                  <span className="text-lg">119番通報する</span>
                </a>

                <p className="text-sm text-red-600 mt-4">
                  ※救急車が到着するまでの間、呼吸や意識状態に注意を払い、
                  状態が急変した場合は再度119番通報してください。
                </p>
              </div>
            </div>

            {/* 注意事項セクション */}
            <div className="p-6 md:p-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">救急車を呼ぶ際の注意事項</h2>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-700">
                    1. 落ち着いて、ゆっくりと正確に状況を説明してください。
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-700">
                    2. 現在地の住所や目標となる建物を確認してください。
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-700">
                    3. 可能であれば、救急車の到着を待つ間、玄関や部屋の明かりをつけてください。
                  </p>
                </div>
              </div>
            </div>

            {/* ホームに戻るボタン */}
            <div className="p-6 md:p-8 border-t border-gray-100">
              <button
                onClick={() => router.push('/')}
                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl border border-gray-200 transition-all duration-300"
              >
                <Home className="w-5 h-5" />
                <span>ホームに戻る</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 