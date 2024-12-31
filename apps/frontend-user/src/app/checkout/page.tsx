"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardFooter } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { ArrowLeft, CreditCard, ShieldCheck, Truck } from 'lucide-react'
import { useRouter } from 'next/navigation'

const mockOrder = {
  items: [
    { id: 1, name: "睡眠サポートサプリ", price: 2980, quantity: 1 },
    { id: 2, name: "リラックスハーブティー", price: 1500, quantity: 2 },
  ],
  shipping: 500,
}

export default function Checkout() {
  const router = useRouter()
  // const [paymentMethod, setPaymentMethod] = useState('credit_card')

  const subtotal = mockOrder.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const total = subtotal + mockOrder.shipping

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Order submitted')
    // Here you would typically process the payment and submit the order
    router.push('/order-complete')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-[#333333]">
            ご注文内容の確認
          </h1>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-2 bg-white shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#4C9A84]">注文内容</h2>
                {mockOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center mb-4 pb-4 border-b border-[#E6F3EF]">
                    <div>
                      <h3 className="font-semibold text-[#333333]">{item.name}</h3>
                      <p className="text-sm text-[#666666]">数量: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#333333]">¥{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[#666666]">小計</p>
                  <p className="font-semibold text-[#333333]">¥{subtotal.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[#666666]">配送料</p>
                  <p className="font-semibold text-[#333333]">¥{mockOrder.shipping.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <p className="text-[#333333]">合計</p>
                  <p className="text-[#4C9A84]">¥{total.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#4C9A84]">クレジットカード情報</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="card_number">カード番号</Label>
                    <Input id="card_number" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry_date">有効期限</Label>
                      <Input id="expiry_date" placeholder="MM / YY" />
                    </div>
                    <div>
                      <Label htmlFor="security_code">セキュリティコード</Label>
                      <Input id="security_code" placeholder="123" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-[#F0F8F5]">
                <Button className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white py-3 text-lg" onClick={handleSubmit}>
                  クレジットカードで支払う
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <Button variant="link" className="text-[#4C9A84] hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              買い物を続ける
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

