"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardFooter } from "../../../components/ui/card"
import { SiteHeader } from '../../../components/site-header'
import { Footer } from '../../../components/footer'
import { ArrowLeft, MessageCircle, HelpCircle, Bot, ShoppingCart } from 'lucide-react'

// Mock consultation data (in a real app, this would come from the backend)
const mockConsultation = {
  id: "C-12345",
  date: "2023年12月15日",
  topic: "睡眠の問題について",
  concern: "最近、寝つきが悪く、夜中に何度も目が覚めてしまいます。日中も疲れが取れず、集中力が低下しています。どうすれば良いでしょうか？",
  questionnaire: [
    { question: "症状はいつ頃から始まりましたか？", answer: "約1ヶ月前から" },
    { question: "1日の睡眠時間は平均どのくらいですか？", answer: "6時間程度" },
    { question: "就寝前の習慣はありますか？", answer: "スマートフォンを見ることが多いです" },
    { question: "カフェインの摂取量はどのくらいですか？", answer: "1日3杯のコーヒーを飲みます" },
    { question: "運動は定期的に行っていますか？", answer: "ほとんど運動していません" },
  ],
  aiResponse: `ご相談ありがとうございます。症状から判断すると、生活習慣の乱れによる不眠の可能性が考えられます。以下のアドバイスを参考にしてみてください：

1. 就寝時間を一定に保つ：
   毎日同じ時間に就寝・起床するよう心がけましょう。休日も含めて規則正しい睡眠リズムを作ることが大切です。

2. 就寝前のルーティンを作る：
   スマートフォンの使用は控え、代わりに読書やストレッチなどリラックスできる活動を取り入れましょう。ブルーライトは睡眠を妨げる可能性があります。

3. カフェイン摂取を控える：
   特に午後以降のカフェイン摂取は控えめにしましょう。代わりにハーブティーなどカフェインレスの飲み物を選ぶことをおすすめします。

4. 運動習慣を取り入れる：
   軽い運動でも構いませんので、定期的な運動習慣を身につけましょう。ただし、就寝直前の激しい運動は避けてください。

5. 睡眠環境を整える：
   寝室の温度、明るさ、騒音レベルを快適な状態に保ちましょう。

これらの対策を1-2週間ほど続けてみて、改善が見られない場合は、医療機関での受診をおすすめします。睡眠の質を向上させることで、日中の疲労感や集中力低下も改善されることが期待できます。`,
  recommendedProducts: [
    { id: 1, name: "睡眠サポートサプリ", price: 2980, image: "/placeholder.svg" },
    { id: 2, name: "リラックスハーブティー", price: 1500, image: "/placeholder.svg" },
    { id: 3, name: "ブルーライトカットメガネ", price: 3500, image: "/placeholder.svg" },
  ],
}

export default function ConsultationDetail() {
  const params = useParams()
  const [expandedSection, setExpandedSection] = useState<string | null>("concern")

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/consultation-history" passHref>
            <Button variant="link" className="mb-4 text-[#4C9A84]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              相談履歴に戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-4 text-[#333333]">{mockConsultation.topic}</h1>
          <p className="text-[#666666] mb-6">相談日: {mockConsultation.date}</p>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                onClick={() => toggleSection("concern")}
                className="w-full flex justify-between items-center text-left mb-2"
              >
                <div className="flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5 text-[#4C9A84]" />
                  <h2 className="text-xl font-semibold text-[#4C9A84]">相談内容</h2>
                </div>
                {expandedSection === "concern" ? "▲" : "▼"}
              </Button>
              {expandedSection === "concern" && (
                <p className="text-[#666666] mt-2">{mockConsultation.concern}</p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                onClick={() => toggleSection("questionnaire")}
                className="w-full flex justify-between items-center text-left mb-2"
              >
                <div className="flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5 text-[#4C9A84]" />
                  <h2 className="text-xl font-semibold text-[#4C9A84]">質問票と回答</h2>
                </div>
                {expandedSection === "questionnaire" ? "▲" : "▼"}
              </Button>
              {expandedSection === "questionnaire" && (
                <div className="mt-2 space-y-4">
                  {mockConsultation.questionnaire.map((item, index) => (
                    <div key={index}>
                      <p className="font-semibold text-[#333333]">Q: {item.question}</p>
                      <p className="text-[#666666]">A: {item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                onClick={() => toggleSection("aiResponse")}
                className="w-full flex justify-between items-center text-left mb-2"
              >
                <div className="flex items-center">
                  <Bot className="mr-2 h-5 w-5 text-[#4C9A84]" />
                  <h2 className="text-xl font-semibold text-[#4C9A84]">AI回答</h2>
                </div>
                {expandedSection === "aiResponse" ? "▲" : "▼"}
              </Button>
              {expandedSection === "aiResponse" && (
                <div className="mt-2 space-y-4 text-[#666666] whitespace-pre-wrap">{mockConsultation.aiResponse}</div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 bg-white shadow-lg">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                onClick={() => toggleSection("recommendedProducts")}
                className="w-full flex justify-between items-center text-left mb-2"
              >
                <div className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5 text-[#4C9A84]" />
                  <h2 className="text-xl font-semibold text-[#4C9A84]">おすすめ商品（相談時）</h2>
                </div>
                {expandedSection === "recommendedProducts" ? "▲" : "▼"}
              </Button>
              {expandedSection === "recommendedProducts" && (
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockConsultation.recommendedProducts.map((product) => (
                    <Card key={product.id} className="bg-white shadow-md">
                      <CardContent className="p-4">
                        <div className="bg-[#F0F8F5] rounded-md mb-4 relative">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={200}
                            height={200}
                            className="w-full h-40 object-cover rounded-md"
                          />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-[#333333]">{product.name}</h3>
                        <p className="text-[#4C9A84] font-bold">¥{product.price.toLocaleString()}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
                          商品を見る
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-[#F0F8F5] p-4 text-sm text-[#666666]">
              ※ 表示されている商品情報は相談時のものです。現在の在庫状況や価格が異なる場合がありますので、ご購入の際は最新の情報をご確認ください。
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

