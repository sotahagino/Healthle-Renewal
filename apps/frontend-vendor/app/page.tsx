'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, User, BarChart } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/images/healthle-logo.png"
              alt="Healthle Logo"
              width={40}
              height={40}
              priority
            />
            <h1 className="ml-2 text-xl font-semibold text-[#333333]">ホーム</h1>
          </div>
          <Button variant="ghost" onClick={() => router.push('/login')}>
            ログアウト
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総売上</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥1,234,567</div>
              <p className="text-xs text-muted-foreground">
                前月比 +12.5%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">注文数</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">256</div>
              <p className="text-xs text-muted-foreground">
                前月比 +8%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">商品数</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">52</div>
              <p className="text-xs text-muted-foreground">
                新規追加 +3
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">在庫切れ商品</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                要対応
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('/products')}
          >
            <Package className="mr-2 h-5 w-5" />
            商品一覧へ
          </Button>
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('/orders')}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            注文一覧へ
          </Button>
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('/account')}
          >
            <User className="mr-2 h-5 w-5" />
            アカウント設定
          </Button>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>お知らせ</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-20 text-sm text-muted-foreground">2023/06/15</span>
                <span>新機能「在庫自動発注」がリリースされました。</span>
              </li>
              <li className="flex items-center">
                <span className="w-20 text-sm text-muted-foreground">2023/06/10</span>
                <span>システムメンテナンスのお知らせ（6/20 深夜1:00-3:00）</span>
              </li>
              <li className="flex items-center">
                <span className="w-20 text-sm text-muted-foreground">2023/06/05</span>
                <span>夏季キャンペーンの申込受付を開始しました。</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

