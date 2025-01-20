"use client"

import { useState, useEffect } from "react"
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { 
  Clock, 
  Clipboard, 
  ShieldCheck, 
  CheckCircle, 
  MessageCircle, 
  Search,
  ThumbsUp,
  ArrowRight,
  ChevronRight,
  X
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

// インターフェース定義
interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options?: QuestionOption[];
}

// 症状カテゴリーの定義
const SYMPTOM_CATEGORIES = [
  { 
    id: 'sleep', 
    name: '睡眠の悩み', 
    example: '寝つきが悪い、夜中に目が覚める',
    options: [
      "寝つきが悪く、眠るまでに時間がかかる",
      "夜中に何度も目が覚めてしまう",
      "朝早く目が覚めてしまい、十分な睡眠が取れない",
      "睡眠薬を使用しないと眠れない",
      "日中の眠気が強く、集中できない"
    ]
  },
  { 
    id: 'headache', 
    name: '頭痛', 
    example: '慢性的な頭痛、片頭痛',
    options: [
      "頭の片側が激しく痛む",
      "頭全体がズキズキと痛む",
      "首や肩のこりを伴う頭痛",
      "光や音に敏感になる",
      "吐き気を伴う頭痛がある"
    ]
  },
  { 
    id: 'stomach', 
    name: '胃腸の不調', 
    example: '胃痛、消化不良',
    options: [
      "食後に胃が重たくなる",
      "胃がむかむかして吐き気がする",
      "お腹が張って痛む",
      "食欲不振が続いている",
      "胸焼けがよくある"
    ]
  },
  { 
    id: 'fatigue', 
    name: '疲労・だるさ', 
    example: '慢性的な疲れ、だるさ',
    options: [
      "朝起きても疲れが取れない",
      "体が重くだるい感じが続く",
      "些細な活動でも疲れやすい",
      "集中力が続かない",
      "疲労感が長期間続いている"
    ]
  },
  { 
    id: 'stress', 
    name: 'ストレス', 
    example: '不安、イライラ',
    options: [
      "イライラが続いて落ち着かない",
      "不安感が強く、心配が止まらない",
      "気分の浮き沈みが激しい",
      "やる気が出ない",
      "緊張が続いて休めない"
    ]
  },
  { 
    id: 'other', 
    name: 'その他の症状', 
    example: 'その他の気になる症状',
    options: [
      "風邪のような症状がある",
      "アレルギー症状が気になる",
      "皮膚のトラブルがある",
      "目の疲れや痛みがある",
      "関節や筋肉の痛みがある"
    ]
  }
]

// よくある相談例
const COMMON_SYMPTOMS = [
  "夜中に何度も目が覚めて困っています",
  "仕事のストレスで不眠が続いています",
  "朝起きても疲れが取れません",
  "頭痛が続いて集中できません",
]

// APIから返される型定義
type MatchedCategory = { category: string; confidence: number }

export default function Home() {
  const router = useRouter()
  const [symptomText, setSymptomText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFloatingCTA, setShowFloatingCTA] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<typeof SYMPTOM_CATEGORIES[0] | null>(null)
  const supabase = createClientComponentClient()

  // スクロールに応じてフローティングCTAを表示
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // スムーズスクロール関数
  const scrollToSymptomInput = () => {
    const textarea = document.getElementById('symptom-textarea')
    if (textarea) {
      const offset = -100 // スクロール位置を100px上に調整
      const elementPosition = textarea.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset + offset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleCategorySelect = (category: typeof SYMPTOM_CATEGORIES[0]) => {
    setSelectedCategory(category)
  }

  const handleOptionSelect = (option: string) => {
    setSymptomText(option)
    setSelectedCategory(null)
    // 調整したスクロール関数を使用
    scrollToSymptomInput()
  }

  const handleCommonSymptomSelect = (symptom: string) => {
    setSymptomText(symptom)
  }

  const handleStartConsultation = async () => {
    setLoading(true)
    setError(null)

    if (!symptomText.trim()) {
      setError("相談内容を入力してください。")
      scrollToSymptomInput()
      return
    }

    try {
      // 症状判定APIを呼び出し
      const symptomAssessmentRes = await fetch('https://api.dify.ai/v1/completion-messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer app-Ymt6FHFyEu2R5sQUlKydYX34',
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

      if (!symptomAssessmentRes.ok) {
        throw new Error('症状判定に失敗しました')
      }

      const symptomAssessmentData = await symptomAssessmentRes.json()
      console.log('Symptom Assessment Response:', symptomAssessmentData)

      // JSONデータを抽出
      let matchedCategories = []
      let isChild = false
      try {
        // カテゴリーIDのマッピング
        const categoryMapping: { [key: string]: number } = {
          '息が苦しい（大人）': 1,
          '息が苦しい（子供）': 2,
          // 他のカテゴリーも同様に追加
        }
        
        // Markdown形式のJSONを抽出
        const jsonMatch = symptomAssessmentData.answer.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          const jsonContent = jsonMatch[1].trim()
          console.log('Extracted JSON content:', jsonContent)
          const jsonData = JSON.parse(jsonContent)
          matchedCategories = jsonData.matched_categories.map((mc: MatchedCategory) => categoryMapping[mc.category]).filter(Boolean)
          isChild = jsonData.is_child
        } else {
          // Markdownでない場合は直接パース
          const jsonData = JSON.parse(symptomAssessmentData.answer)
          matchedCategories = jsonData.matched_categories.map((mc: MatchedCategory) => categoryMapping[mc.category]).filter(Boolean)
          isChild = jsonData.is_child
        }
        console.log('Parsed data:', { matchedCategories, isChild })
      } catch (error) {
        console.error('症状判定結果の解析に失敗しました:', error)
      }

      // 問診データを作成
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptom_text: symptomText,
          matched_categories: matchedCategories,
          is_child: isChild
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        console.error('Interview creation failed:', errorData)
        throw new Error(errorData.details || errorData.error || '問診の開始に失敗しました')
      }

      const { interview_id } = await res.json()

      // 症状カテゴリーが一致した場合は重症度判定画面へ遷移
      if (matchedCategories && matchedCategories.length > 0) {
        router.push(`/urgency-assessment?interview_id=${interview_id}&category_id=${matchedCategories[0]}`)
      } else {
        router.push(`/medical?interview_id=${interview_id}`)
      }

    } catch (error) {
      console.error('Error in handleStartConsultation:', error)
      setError(error instanceof Error ? error.message : "予期せぬエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      
      <main className="flex-grow pt-12">
        <div className="max-w-md mx-auto animate-fade-in px-5">
          {/* 新しい画像セクション */}
          <div className="relative w-full h-[300px] mb-4">
            <div className="absolute inset-0 bg-white"></div>
            <Image
              src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/homepagev4.png"
              alt="医師の画像"
              fill
              style={{ objectFit: 'contain' }}
              priority
              className="z-10"
            />
          </div>

          {/* メイン相談フォーム */}
          <div className="relative z-20">
            <Card className="bg-white shadow-lg mb-8">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-text-primary mb-2">あなたの悩みを教えてください</h2>
                  <p className="text-sm text-text-secondary">具体的に書くほど、より適切なアドバイスができます</p>
                </div>
                
                {/* よくある相談例 */}
                <div className="mb-4">
                  <p className="text-sm text-text-secondary mb-2">よくある相談例：</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SYMPTOMS.map((symptom, index) => (
                      <button
                        key={index}
                        onClick={() => handleCommonSymptomSelect(symptom)}
                        className="text-xs bg-secondary text-accent px-3 py-1 rounded-full hover:bg-accent hover:text-white transition-colors"
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  id="symptom-textarea"
                  placeholder="例：最近寝つきが悪く、夜中に何度も目が覚めてしまいます。日中も疲れが取れず、集中力が低下しています..."
                  className="min-h-[120px] text-base border-2 border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84] mb-2 transition-all duration-300 p-4"
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                />
                
                <p className="text-xs text-text-secondary mb-4 text-right">
                  {symptomText.length}/1000文字
                </p>

                {error && (
                  <p className="text-red-500 text-sm mb-4 animate-shake">{error}</p>
                )}

                <Button 
                  onClick={handleStartConsultation}
                  className="w-full bg-primary hover:bg-primary-hover text-white text-lg py-5 font-bold rounded-xl shadow transition-all duration-300 flex items-center justify-center gap-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      <span>質問票を生成中...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      <span>無料で相談を始める</span>
                    </>
                  )}
                </Button>

                {loading && (
                  <div className="mt-4 bg-secondary/30 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-text-primary">あなたに最適な質問を準備中...</p>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        <span>入力内容を分析中</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        <span>症状に合わせた質問を選定中</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        <span>より適切な回答のために質問を最適化中</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-text-secondary text-center">
                      お客様に最適な質問票を作成しています。しばらくお待ちください。
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 特徴セクション */}
            <div className="grid grid-cols-2 gap-4 mb-12 px-1">
              {[
                { icon: Clock, text: '24時間対応', subtext: '深夜でも休日でも' },
                { icon: Clipboard, text: '丁寧な質問', subtext: '症状を正確に把握' },
                { icon: MessageCircle, text: '追加質問無制限', subtext: '気になることは何でも' },
                { icon: CheckCircle, text: 'すぐに購入', subtext: '推奨薬をお届け' }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <feature.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-2 text-center">{feature.text}</h3>
                    <p className="text-xs text-text-secondary text-center leading-relaxed">{feature.subtext}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 選ばれる理由セクション */}
            <Card className="bg-white mb-16">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-accent mb-8 pb-3 border-b-2 border-secondary">
                  Healthleが選ばれる理由
                </h2>
                <div className="space-y-8">
                  {[
                    {
                      title: '独自のAI問診システム',
                      description: '独自開発の質問票システムにより、見過ごされがちな症状の背景情報を詳しく把握',
                      icon: ShieldCheck
                    },
                    {
                      title: 'エビデンスに基づくアドバイス',
                      description: '最新の医学的知見に基づいた、信頼性の高いセルフケア情報を提供',
                      icon: Clipboard
                    },
                    {
                      title: '簡単購入システム',
                      description: '症状に合わせて提案された医薬品を、その場でワンクリックで購入可能',
                      icon: CheckCircle
                    },
                    {
                      title: '24時間365日無料',
                      description: '急な体調不良でも、いつでもどこでも無料で専門的なアドバイスにアクセス可能',
                      icon: Clock
                    }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start space-x-5">
                      <div className="w-12 h-12 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base mb-2 text-text-primary">{feature.title}</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 症状カテゴリー */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                症状から相談
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {SYMPTOM_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className="bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
                  >
                    <p className="font-bold text-sm mb-1">{category.name}</p>
                    <p className="text-xs text-text-secondary">{category.example}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 症状選択モーダル */}
            {selectedCategory && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md p-6 relative animate-fade-in">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-lg font-bold mb-4">{selectedCategory.name}の症状</h3>
                  <div className="space-y-2">
                    {selectedCategory.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        className="w-full text-left p-3 rounded-lg hover:bg-secondary/20 transition-colors text-sm"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* フローティングCTAボタン */}
      {showFloatingCTA && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-4 animate-fade-in">
          <Button
            onClick={() => {
              if (!symptomText.trim()) {
                scrollToSymptomInput()
              } else {
                handleStartConsultation()
              }
            }}
            className="w-full max-w-md mx-auto bg-primary hover:bg-primary-hover text-white text-lg py-5 font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
            disabled={loading}
          >
            {loading ? (
              <>相談を開始中...</>
            ) : (
              <>
                <MessageCircle className="w-6 h-6" />
                無料で相談を始める
              </>
            )}
          </Button>
        </div>
      )}

      <Footer />
    </div>
  )
}