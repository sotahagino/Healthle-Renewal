'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>出店者管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              出店者の登録・編集・一覧の確認ができます。
            </p>
            <Button onClick={() => router.push('/vendors')}>
              出店者一覧へ
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>商品管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              商品の登録・編集・一覧の確認ができます。
            </p>
            <Button onClick={() => router.push('/products')}>
              商品一覧へ
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>注文管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              注文の一覧確認と管理ができます。
            </p>
            <Button onClick={() => router.push('/orders')}>
              注文一覧へ
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>ユーザー管理</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              ユーザーの一覧確認と管理ができます。
            </p>
            <Button onClick={() => router.push('/users')}>
              ユーザー一覧へ
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
