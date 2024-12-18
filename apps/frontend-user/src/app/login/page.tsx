"use client"

import Image from 'next/image'
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { ArrowRight, Lock, Shield } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromPurchase = searchParams.get('fromPurchase')

  const handleLogin = () => {
    // LINEログイン処理を実装
    // 商品購入フローからの場合はuser-infoへ、それ以外はmypageへ遷移
    if (fromPurchase === 'true') {
      router.push('/user-info')
    } else {
      router.push('/mypage')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-md mx-auto bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <Image
                src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
                alt="Healthle"
                width={80}
                height={80}
                className="mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-[#333333] mb-2">Healthleへようこそ</h1>
              <p className="text-[#666666]">LINEアカウントでログインして始めましょう</p>
            </div>
            <Button 
              onClick={handleLogin}
              className="w-full bg-[#00B900] hover:bg-[#00A000] text-white py-6 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center"
            >
              <Image
                src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/LINE_logo.svg.webp?t=2024-12-15T11%3A39%3A27.814Z"
                alt="LINE"
                width={24}
                height={24}
                className="mr-2"
              />
              LINEでログイン
            </Button>
            <div className="mt-6 text-center text-sm text-[#666666]">
              <p className="mb-2">ログインすることで、以下に同意したことになります：</p>
              <div className="flex justify-center space-x-4">
                <a href="/terms" className="text-[#4C9A84] hover:underline flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  利用規約
                </a>
                <a href="/privacy" className="text-[#4C9A84] hover:underline flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  プライバシーポリシー
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold text-[#333333] mb-4">Healthleの特徴</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: '24時間AI健康相談', description: 'いつでもどこでも、AIがあなたの健康相談に対応します。' },
              { title: 'プライバシー保護', description: '厳重なセキュリティ対策で、あなたの情報を守ります。' },
              { title: '専門家監修の情報提供', description: '信頼できる健康情報と製品をご紹介します。' },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-[#4C9A84] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#666666]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 text-center">
          <Button variant="link" className="text-[#4C9A84] hover:underline">
            アカウントをお持ちでない方はこちら
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

