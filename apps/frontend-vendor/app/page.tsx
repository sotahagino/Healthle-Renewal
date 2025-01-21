'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { Card } from "@/components/ui/card"

export default function Home() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#E6F3EF] via-white to-[#F5F9F7]">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Healthle 出店者管理システム
            </h1>
            <p className="text-gray-600">
              商品管理、注文管理、店舗情報の設定をこちらから行えます
            </p>
          </div>

          {/* 注文状況サマリー */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Card className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h4 className="text-sm font-medium text-gray-600">注文確認待ち</h4>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">8</span>
                <span className="text-sm text-gray-500 ml-1">件</span>
              </div>
            </Card>

            <Card className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <h4 className="text-sm font-medium text-gray-600">発送待ち</h4>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">3</span>
                <span className="text-sm text-gray-500 ml-1">件</span>
              </div>
            </Card>

            <Card className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h4 className="text-sm font-medium text-gray-600">問い合わせ</h4>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">0</span>
                <span className="text-sm text-gray-500 ml-1">件</span>
                <span className="text-xs text-gray-400 ml-2">（未対応 0件）</span>
              </div>
            </Card>

            <Card className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h4 className="text-sm font-medium text-gray-600">本日の売上</h4>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">12,800</span>
                <span className="text-sm text-gray-500 ml-1">円</span>
              </div>
            </Card>
          </div>

          {/* メインメニュー */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#E6F3EF] rounded-full flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-xl font-semibold ml-4">商品管理</h3>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  商品の登録・編集・一覧の確認ができます。在庫管理も可能です。
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  商品一覧へ
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#E6F3EF] rounded-full flex items-center justify-center">
                    <span className="text-2xl">🛍️</span>
                  </div>
                  <h3 className="text-xl font-semibold ml-4">注文管理</h3>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  注文の確認・ステータス更新ができます。配送状況の管理も可能です。
                </p>
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  注文一覧へ
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#E6F3EF] rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <h3 className="text-xl font-semibold ml-4">店舗情報</h3>
                </div>
                <p className="text-gray-600 mb-6 flex-grow">
                  店舗の基本情報や営業時間の設定、スタッフ管理ができます。
                </p>
                <Link
                  href="/pharmacy/settings"
                  className="inline-flex items-center justify-center w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  店舗情報設定へ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

