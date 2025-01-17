"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardFooter } from "../../components/ui/card"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { CheckCircle, Package, Truck, ArrowRight } from 'lucide-react'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useRouter } from 'next/navigation'

// Mock order data (in a real app, this would come from the backend)
const mockOrder = {
  orderNumber: "HL-12345",
  date: "2023年12月15日",
  total: 5980,
  items: [
    { id: 1, name: "睡眠サポートサプリ", price: 2980, quantity: 1 },
    { id: 2, name: "リラックスハーブティー", price: 1500, quantity: 2 },
  ],
  shipping: 500,
}

export default function OrderComplete() {
  const router = useRouter()

  const handleViewOrderDetails = () => {
    router.push('/mypage')
  }

  const handleContinueShopping = () => {
    router.push('/result')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-2xl mx-auto bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-[#4C9A84] mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-[#333333] mb-2">ご注文ありがとうございます</h1>
              <p className="text-[#666666]">注文番号: {mockOrder.orderNumber}</p>
              <p className="text-[#666666]">注文日: {mockOrder.date}</p>
            </div>
            
            <div className="border-t border-b border-[#E6F3EF] py-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-[#4C9A84]">注文内容</h2>
              {mockOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold text-[#333333]">{item.name}</h3>
                    <p className="text-sm text-[#666666]">数量: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-[#333333]">¥{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#E6F3EF]">
                <p className="font-bold text-[#333333]">合計</p>
                <p className="font-bold text-[#4C9A84]">¥{mockOrder.total.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-[#4C9A84]">次のステップ</h2>
              <div className="flex items-start">
                <Package className="w-6 h-6 text-[#4C9A84] mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#333333]">商品の準備</h3>
                  <p className="text-[#666666]">ご注文いただいた商品を準備しています。</p>
                </div>
              </div>
              <div className="flex items-start">
                <Truck className="w-6 h-6 text-[#4C9A84] mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#333333]">発送</h3>
                  <p className="text-[#666666]">商品の発送が完了しましたら、メールでお知らせいたします。</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 bg-[#F0F8F5] flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={handleViewOrderDetails}
            >
              注文詳細を見る
            </Button>
            <Button 
              className="w-full sm:w-auto bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
              onClick={handleContinueShopping}
            >
              相談を続ける
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

