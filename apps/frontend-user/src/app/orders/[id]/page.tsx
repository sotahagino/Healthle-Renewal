"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useParams } from 'next/navigation'
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardFooter } from "../../../components/ui/card"
import { SiteHeader } from '../../../components/site-header'
import { Footer } from '../../../components/footer'
import { ArrowLeft, Package, Truck, CreditCard, CheckCircle } from 'lucide-react'

// Mock order data (in a real app, this would come from the backend)
const mockOrder = {
  id: "HL-12345",
  date: "2023年12月15日",
  status: "発送済み",
  estimatedDelivery: "2023年12月18日",
  total: 5980,
  items: [
    { id: 1, name: "睡眠サポートサプリ", price: 2980, quantity: 1, image: "/placeholder.svg" },
    { id: 2, name: "リラックスハーブティー", price: 1500, quantity: 2, image: "/placeholder.svg" },
  ],
  shipping: {
    address: "東京都渋谷区神南1-2-3",
    postalCode: "150-0041",
    method: "通常配送",
    cost: 500,
  },
  payment: {
    method: "クレジットカード",
    last4: "1234",
  }
}

export default function OrderDetail() {
  const params = useParams()
  const [expandedSection, setExpandedSection] = useState<string | null>("items")

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const subtotal = mockOrder.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/mypage" passHref>
            <Button variant="link" className="mb-4 text-[#4C9A84]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              マイページに戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-4 text-[#333333]">注文詳細</h1>
          <p className="text-[#666666] mb-6">注文番号: {mockOrder.id} | 注文日: {mockOrder.date}</p>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#4C9A84]">注文状況</h2>
                  <p className="text-[#666666]">{mockOrder.status}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-[#4C9A84]" />
              </div>
              <p className="text-[#666666]">配送予定日: {mockOrder.estimatedDelivery}</p>
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                onClick={() => toggleSection("items")}
                className="w-full flex justify-between items-center text-left mb-2"
              >
                <div className="flex items-center">
                  <Package className="mr-2 h-5 w-5 text-[#4C9A84]" />
                  <h2 className="text-xl font-semibold text-[#4C9A84]">注文内容</h2>
                </div>
                {expandedSection === "items" ? "▲" : "▼"}
              </Button>
              {expandedSection === "items" && (
                <div className="mt-4 space-y-4">
                  {mockOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-md"
                      />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-[#333333]">{item.name}</h3>
                        <p className="text-[#666666]">数量: {item.quantity}</p>
                        <p className="text-[#4C9A84] font-semibold">¥{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between">
                      <p className="text-[#666666]">小計</p>
                      <p className="font-semibold">¥{subtotal.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-[#666666]">配送料</p>
                      <p className="font-semibold">¥{mockOrder.shipping.cost.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-2">
                      <p className="text-[#333333]">合計</p>
                      <p className="text-[#4C9A84]">¥{mockOrder.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                onClick={() => toggleSection("shipping")}
                className="w-full flex justify-between items-center text-left mb-2"
              >
                <div className="flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-[#4C9A84]" />
                  <h2 className="text-xl font-semibold text-[#4C9A84]">配送情報</h2>
                </div>
                {expandedSection === "shipping" ? "▲" : "▼"}
              </Button>
              {expandedSection === "shipping" && (
                <div className="mt-2 space-y-2">
                  <p className="text-[#666666]">配送方法: {mockOrder.shipping.method}</p>
                  <p className="text-[#666666]">配送先住所:</p>
                  <p className="font-semibold text-[#333333]">
                    〒{mockOrder.shipping.postalCode}<br />
                    {mockOrder.shipping.address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                onClick={() => toggleSection("payment")}
                className="w-full flex justify-between items-center text-left mb-2"
              >
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-[#4C9A84]" />
                  <h2 className="text-xl font-semibold text-[#4C9A84]">お支払い情報</h2>
                </div>
                {expandedSection === "payment" ? "▲" : "▼"}
              </Button>
              {expandedSection === "payment" && (
                <div className="mt-2 space-y-2">
                  <p className="text-[#666666]">支払い方法: {mockOrder.payment.method}</p>
                  <p className="text-[#666666]">カード番号末尾: ****{mockOrder.payment.last4}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link href="/contact" passHref>
              <Button variant="outline" className="text-[#4C9A84] border-[#4C9A84]">
                この注文について問い合わせる
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

