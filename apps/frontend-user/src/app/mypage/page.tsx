"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Package, User, ChevronRight, Edit } from 'lucide-react'

// Mock user data (in a real app, this would come from the backend)
const mockUser = {
  name: "山田 太郎",
  gender: "男性",
  birthYear: "1990",
  birthMonth: "1",
  birthDay: "1",
  email: "yamada@example.com",
  postalCode: "123-4567",
  prefecture: "東京都",
  city: "渋谷区",
  address: "1-2-3 ○○マンション101",
  phoneNumber: "090-1234-5678",
  joinDate: "2023年10月1日",
}

// Mock order history (in a real app, this would come from the backend)
const mockOrders = [
  { id: "HL-12345", date: "2023年12月15日", total: 5980, status: "発送済み" },
  { id: "HL-12344", date: "2023年11月20日", total: 3980, status: "配達完了" },
  { id: "HL-12343", date: "2023年10月5日", total: 2980, status: "配達完了" },
]

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("orders")

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#333333]">マイページ</h1>
        <Card className="max-w-4xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-[#4C9A84] rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                {mockUser.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#333333]">{mockUser.name}</h2>
                <p className="text-[#666666]">{mockUser.email}</p>
                <p className="text-sm text-[#666666]">会員登録日: {mockUser.joinDate}</p>
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders" className="text-[#4C9A84]">注文履歴</TabsTrigger>
                <TabsTrigger value="profile" className="text-[#4C9A84]">プロフィール</TabsTrigger>
              </TabsList>
              <TabsContent value="orders">
                <h3 className="text-lg font-semibold mb-4 text-[#4C9A84]">注文履歴</h3>
                {mockOrders.map((order) => (
                  <Card key={order.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-[#333333]">注文番号: {order.id}</p>
                          <p className="text-sm text-[#666666]">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#4C9A84]">¥{order.total.toLocaleString()}</p>
                          <p className="text-sm text-[#666666]">{order.status}</p>
                        </div>
                      </div>
                      <Link href={`/orders/${order.id}`} passHref>
                        <Button variant="link" className="text-[#4C9A84] p-0 h-auto">
                          詳細を見る
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="profile">
                <h3 className="text-lg font-semibold mb-4 text-[#4C9A84]">プロフィール情報</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-[#666666]">氏名</p>
                        <p className="font-semibold text-[#333333]">{mockUser.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">性別</p>
                        <p className="font-semibold text-[#333333]">{mockUser.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">生年月日</p>
                        <p className="font-semibold text-[#333333]">{mockUser.birthYear}年{mockUser.birthMonth}月{mockUser.birthDay}日</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">メールアドレス</p>
                        <p className="font-semibold text-[#333333]">{mockUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">電話番号</p>
                        <p className="font-semibold text-[#333333]">{mockUser.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">郵便番号</p>
                        <p className="font-semibold text-[#333333]">{mockUser.postalCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">住所</p>
                        <p className="font-semibold text-[#333333]">
                          {mockUser.prefecture}{mockUser.city}{mockUser.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666666]">会員登録日</p>
                        <p className="font-semibold text-[#333333]">{mockUser.joinDate}</p>
                      </div>
                    </div>
                    <Link href="/profile/edit" passHref>
                      <Button className="mt-6 bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
                        <Edit className="mr-2 h-4 w-4" />
                        プロフィールを編集
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

