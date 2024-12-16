import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { Clock, Clipboard, ShieldCheck, CheckCircle, MessageCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold text-center mb-6 text-[#333333] leading-tight">
          あなたの悩みに寄り添い、<br />適切な回答を提供します
        </h1>
        <p className="text-center text-[#666666] mb-10">
          日々の不調に対するセルフケアのお手伝いをします
        </p>
        <div className="space-y-12">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#4C9A84] mb-4 text-center">
                健康相談を始めましょう
              </h2>
              <Textarea
                placeholder="あなたの健康の悩みを入力してください..."
                className="min-h-[120px] text-[#333333] border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84] mb-4"
              />
              <p className="text-sm text-[#666666] mb-6">
                ご入力いただいた悩みに応じて、個別の質問票を用意します。
                見落としがちな情報も整理し、より的確な情報提供を行います。
              </p>
              <Button className="w-full bg-[#3A8B73] hover:bg-[#2E7A62] text-white text-lg py-6 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg">
                無料で相談を始める
              </Button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: Clock, text: '24時間いつでも対応' },
              { icon: Clipboard, text: '丁寧な質問票で根本要因を把握' },
              { icon: MessageCircle, text: '追加の質問も無制限' },
              { icon: CheckCircle, text: '的確な情報と一般用医薬品の紹介' }
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center bg-white p-4 rounded-lg shadow">
                <feature.icon className="w-10 h-10 text-[#4C9A84] mb-3" />
                <p className="text-sm font-semibold text-[#333333] text-center">{feature.text}</p>
              </div>
            ))}
          </div>
          <Card className="bg-white">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-[#4C9A84] mb-6 pb-2 border-b border-[#A7D7C5]">
                Healthleが選ばれる理由
              </h2>
              <ul className="space-y-4 text-sm text-[#333333]">
                {[
                  '独自の質問票で見過ごされがちな背景情報を抽出',
                  'お悩みに合わせたセルフケア情報を丁寧に紹介',
                  'プライバシーを重視した安全な相談環境',
                  '完全無料でいつでもご利用可能'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-[#4C9A84] mr-3 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}