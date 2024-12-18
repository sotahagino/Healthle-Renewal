"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { SiteHeader } from '../../components/site-header'
import { Footer } from '../../components/footer'
import { MessageCircle, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

// Mock consultation history data (in a real app, this would come from the backend)
const mockConsultations = [
  {
    id: "C-12345",
    date: "2023年12月15日",
    topic: "睡眠の問題について",
    summary: "睡眠の質が悪く、夜中に何度も目が覚めてしまう。",
    advice: "就寝時間を一定に保ち、寝室の環境を整えることをおすすめします。カフェインの摂取を控え、就寝前にリラックスする習慣を作りましょう。",
  },
  {
    id: "C-12344",
    date: "2023年11月20日",
    topic: "ストレス管理について",
    summary: "仕事のストレスが高く、集中力が低下している。",
    advice: "定期的な運動や瞑想を取り入れ、ストレス解消法を見つけることが大切です。また、十分な睡眠と栄養バランスの良い食事を心がけましょう。",
  },
  {
    id: "C-12343",
    date: "2023年10月5日",
    topic: "肩こりの悩みについて",
    summary: "デスクワークが多く、肩こりがひどい。",
    advice: "定期的なストレッチや姿勢の改善が効果的です。また、デスクの高さや椅子の調整も重要です。温めたり、軽いマッサージを行うのもおすすめです。",
  },
]

export default function ConsultationHistory() {
  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    if (expandedConsultation === id) {
      setExpandedConsultation(null)
    } else {
      setExpandedConsultation(id)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#333333]">相談履歴</h1>
        <div className="max-w-3xl mx-auto">
          {mockConsultations.map((consultation) => (
            <Card key={consultation.id} className="mb-6 bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#4C9A84] mb-2">{consultation.topic}</h2>
                    <p className="text-sm text-[#666666]">{consultation.date}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(consultation.id)}
                    className="text-[#4C9A84]"
                  >
                    {expandedConsultation === consultation.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-[#333333] mb-2">相談内容：</h3>
                  <p className="text-[#666666]">{consultation.summary}</p>
                </div>
                {expandedConsultation === consultation.id && (
                  <div className="mt-4 pt-4 border-t border-[#E6F3EF]">
                    <h3 className="font-semibold text-[#333333] mb-2">アドバイス：</h3>
                    <p className="text-[#666666]">{consultation.advice}</p>
                  </div>
                )}
                <div className="mt-4 flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#4C9A84] border-[#4C9A84]"
                    onClick={() => toggleExpand(consultation.id)}
                  >
                    {expandedConsultation === consultation.id ? "詳細を閉じる" : "詳細を見る"}
                  </Button>
                  <Link href={`/consultation/${consultation.id}`} passHref>
                    <Button variant="link" className="text-[#4C9A84] p-0 h-auto">
                      相談結果を見る
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/consultation" passHref>
            <Button className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
              <MessageCircle className="mr-2 h-5 w-5" />
              新しい相談を始める
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

