'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Users, Store, FileText, Settings } from 'lucide-react'
import { Header } from "@/components/Header"

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録商品数</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">注文数</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">567</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ユーザー数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,901</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">出店者数</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">234</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('vendors')}
          >
            <Store className="mr-2 h-5 w-5" />
            出店者管理
          </Button>
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('products')}
          >
            <Package className="mr-2 h-5 w-5" />
            商品管理
          </Button>
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('orders')}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            注文管理
          </Button>
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('users')}
          >
            <Users className="mr-2 h-5 w-5" />
            ユーザー管理
          </Button>
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('logs')}
          >
            <FileText className="mr-2 h-5 w-5" />
            操作ログ
          </Button>
          <Button 
            className="h-auto py-4 bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
            onClick={() => router.push('account')}
          >
            <Settings className="mr-2 h-5 w-5" />
            アカウント管理
          </Button>
        </div>
      </main>
    </div>
  )
}

