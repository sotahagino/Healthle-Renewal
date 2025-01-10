"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { Clock, Clipboard, ShieldCheck, CheckCircle, MessageCircle, History } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Home() {
  const router = useRouter()
  const [symptomText, setSymptomText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleStartConsultation = async () => {
    setLoading(true)
    setError(null)

    if (!symptomText.trim()) {
      setError("相談内容を入力してください。")
      setLoading(false)
      return
    }

    try {
      // 問診データを作成
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptom_text: symptomText,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '問診の開始に失敗しました')
      }

      const { interview_id } = await res.json()

      // 質問生成APIを呼び出し
      const difyRes = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/completion-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_QUESTION_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            symptom: symptomText
          },
          response_mode: "blocking",
          user: "anonymous"
        })
      })

      if (!difyRes.ok) {
        throw new Error('質問の生成に失敗しました')
      }

      const difyData = await difyRes.json()
      console.log('Dify API response:', difyData)

      // Markdown形式の回答からJSONを抽出して正規化
      const jsonMatch = difyData.answer.match(/```json\n([\s\S]*?)\n```/)
      if (!jsonMatch) {
        throw new Error('質問データの形式が不正です')
      }

      let questions
      try {
        const jsonContent = jsonMatch[1]
          .trim()
          .replace(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g, '') // 不要な空白を削除（文字列内は除く）
        
        const parsedData = JSON.parse(jsonContent)
        questions = parsedData.questions

        if (!Array.isArray(questions)) {
          throw new Error('質問データが配列ではありません')
        }

        // 質問データの正規化
        questions = questions.map(q => ({
          ...q,
          id: q.id.trim(),
          text: q.text.trim(),
          type: q.type.trim(),
          options: Array.isArray(q.options) ? q.options.map(opt => ({
            id: opt.id.trim(),
            text: opt.text.trim()
          })) : []
        }))

        console.log('Normalized questions:', questions)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('質問データの解析に失敗しました')
      }

      // 質問票画面に遷移
      const encodedData = encodeURIComponent(JSON.stringify(questions))
      router.push(`/questionnaire?interview_id=${interview_id}&data=${encodedData}`)

    } catch (error) {
      console.error('Error in handleStartConsultation:', error)
      setError(error instanceof Error ? error.message : "予期せぬエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

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

        <Card className="bg-white shadow-lg mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-[#4C9A84] mb-4 text-center">
              健康相談を始めましょう
            </h2>
            <Textarea
              placeholder="あなたの健康の悩みを入力してください..."
              className="min-h-[120px] text-[#333333] border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84] mb-4"
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
            />

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <Button 
              onClick={handleStartConsultation}
              className="w-full bg-[#3A8B73] hover:bg-[#2E7A62] text-white text-lg py-6 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg"
              disabled={loading}
            >
              {loading ? "質問票を生成中..." : "無料で相談を始める"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6 mb-12">
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
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-[#4C9A84] mb-8 pb-3 border-b-2 border-[#A7D7C5]">
              Healthleが選ばれる理由
            </h2>
            <ul className="space-y-6 text-[#333333]">
              {[
                {
                  title: '独自のAI問診システム',
                  description: '独自開発の質問票システムにより、見過ごされがちな症状の背景情報を詳しく把握し、より正確な判断をサポート'
                },
                {
                  title: 'エビデンスに基づいたアドバイス',
                  description: '最新の医学的知見に基づいた、信頼性の高いセルフケア情報と一般用医薬品の提案を提供'
                },
                {
                  title: '安心のセキュリティ対策',
                  description: '医療情報の取り扱いに準拠したセキュリティ体制で、プライバシーを確実に保護'
                },
                {
                  title: '24時間365日無料サービス',
                  description: '急な体調不良でも、いつでもどこでも無料で専門的なアドバイスにアクセス可能'
                }
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-[#4C9A84] mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold block mb-1">{feature.title}</span>
                    <span className="text-sm leading-relaxed text-[#666666]">{feature.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}