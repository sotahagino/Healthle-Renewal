'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { loading } = useAuth()

  if (loading) {
    return <div>読み込み中...</div>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Image
          src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png?t=2024-12-30T16%3A02%3A37.682Z"
          alt="Healthle"
          width={32}
          height={32}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">Healthle 出店者管理</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-xl">📦</span>
            <h3 className="text-lg font-semibold ml-2">商品管理</h3>
          </div>
          <p className="text-gray-600 mb-4">商品の登録・編集・一覧の確認ができます。</p>
          <Link
            href="/products"
            className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            商品一覧へ
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-xl">🛍️</span>
            <h3 className="text-lg font-semibold ml-2">注文管理</h3>
          </div>
          <p className="text-gray-600 mb-4">注文の確認・ステータス更新ができます。</p>
          <Link
            href="/orders"
            className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            注文一覧へ
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <span className="text-xl">🏥</span>
            <h3 className="text-lg font-semibold ml-2">店舗情報</h3>
          </div>
          <p className="text-gray-600 mb-4">店舗の基本情報や営業時間の設定ができます。</p>
          <Link
            href="/pharmacy/settings"
            className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            店舗情報設定へ
          </Link>
        </div>
      </div>
    </main>
  )
}

