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
    id: 'adult-respiratory', 
    name: '呼吸器の症状（大人）', 
    example: '息苦しさ、ゼーゼー、ぜんそく',
    options: [
      "息が苦しい（大人）",
      "呼吸がゼーゼーする（大人）",
      "ぜんそく発作（大人）"
    ]
  },
  { 
    id: 'adult-emergency', 
    name: '緊急性の高い症状（大人）', 
    example: '意識障害、けいれん、胸痛',
    options: [
      "動悸（大人・こども）",
      "意識がおかしい（大人）",
      "けいれん（大人）",
      "胸が痛い（大人）",
      "ろれつが回らない（大人）"
    ]
  },
  { 
    id: 'adult-pain', 
    name: '痛みの症状（大人）', 
    example: '頭痛、腰痛、関節痛',
    options: [
      "頭痛（大人）",
      "背中が痛い（大人）",
      "腰痛（大人）",
      "首が痛い・肩が痛い（大人）",
      "しびれ（大人）"
    ]
  },
  { 
    id: 'adult-common', 
    name: '一般的な症状（大人）', 
    example: '風邪、発熱、のどの痛み',
    options: [
      "風邪をひいた（大人）",
      "発熱（大人）",
      "発疹（大人）",
      "のどが痛い（大人）",
      "めまい・ふらつき（大人）"
    ]
  },
  { 
    id: 'adult-digestive', 
    name: '消化器の症状（大人）', 
    example: '腹痛、吐き気、便通異常',
    options: [
      "腹痛（大人）",
      "便秘（大人）",
      "下痢（大人）",
      "吐き気・嘔吐（大人）",
      "吐血・下血・血便（大人）"
    ]
  },
  { 
    id: 'common-injury', 
    name: 'けが・やけど', 
    example: '打撲、切り傷、やけど',
    options: [
      "やけど（大人・こども）",
      "頭のけが（大人）",
      "眼のけが（大人・こども）",
      "手足・顔面のけが（大人・こども）",
      "胸やおなかをぶつけた・胸やおなかに刺さった（大人・こども）"
    ]
  },
  { 
    id: 'common-emergency', 
    name: '誤飲・中毒', 
    example: '異物誤飲、薬の過剰摂取',
    options: [
      "何か固形物を飲み込んだ（大人・こども）",
      "何か液体を飲んだ（大人・こども）",
      "薬をたくさん飲んだ・間違った薬を飲んだ（大人・こども）",
      "熱中症（大人・こども）"
    ]
  },
  { 
    id: 'child-symptoms', 
    name: '子供の症状', 
    example: '発熱、けいれん、泣き止まない',
    options: [
      "発熱（こども）",
      "けいれん（こども）",
      "せき（こども）",
      "息が苦しい（こども）",
      "ぜんそく発作（こども）",
      "発疹（こども）",
      "吐き気・嘔吐（こども）",
      "腹痛（こども）",
      "便秘（こども）",
      "便の色の異常（こども）",
      "頭痛（こども）",
      "泣き止まない（こども）",
      "頭のけが・首のけが（こども）"
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

// 症状カテゴリーマッピング
const categoryMapping: { [key: string]: number } = {
  // 大人の症状
  '息が苦しい（大人）': 1,
  '呼吸がゼーゼーする（大人）': 2,
  'ぜんそく発作（大人）': 3,
  '動悸（大人・こども）': 4,
  '意識がおかしい（大人）': 5,
  'けいれん（大人）': 6,
  '頭痛（大人）': 7,
  '胸が痛い（大人）': 8,
  '背中が痛い（大人）': 9,
  'ろれつが回らない（大人）': 10,
  '腰痛（大人）': 11,
  '風邪をひいた（大人）': 12,
  '発熱（大人）': 13,
  '発疹（大人）': 14,
  'のどが痛い（大人）': 15,
  '腹痛（大人）': 16,
  '便秘（大人）': 17,
  '下痢（大人）': 18,
  '吐き気・嘔吐（大人）': 19,
  '吐血・下血・血便（大人）': 20,
  '尿が出にくい（大人・こども）': 21,
  '膣からの出血（大人）': 22,
  'めまい・ふらつき（大人）': 23,
  'しびれ（大人）': 24,
  '首が痛い・肩が痛い（大人）': 25,

  // 共通の症状（大人・こども）
  'アレルギー（大人・こども）': 26,
  '高血圧（大人）': 27,
  '眼科関連（大人・こども）': 28,
  '鼻のけが・鼻血（大人・こども）': 29,
  '口の中や歯の問題（大人・こども）': 30,
  '手や腕の問題（大人・こども）': 31,
  '足（太もものつけ根から足首）の問題（大人・こども）': 32,
  '足首から先の問題（大人・こども）': 33,
  '咬まれた・刺された（大人・こども）': 34,
  'やけど（大人・こども）': 35,
  '頭のけが（大人）': 36,
  '眼のけが（大人・こども）': 37,
  '胸やおなかをぶつけた・胸やおなかに刺さった（大人・こども）': 38,
  '手足・顔面のけが（大人・こども）': 39,
  '何か固形物を飲み込んだ（大人・こども）': 40,
  '何か液体を飲んだ（大人・こども）': 41,
  '薬をたくさん飲んだ・間違った薬を飲んだ（大人・こども）': 42,
  '熱中症（大人・こども）': 43,

  // 子供の症状
  '発熱（こども）': 44,
  'けいれん（こども）': 45,
  'せき（こども）': 46,
  '鼻水・鼻づまり（こども）': 47,
  'ぜんそく発作（こども）': 48,
  '息が苦しい（こども）': 49,
  '発疹（こども）': 50,
  '吐き気・嘔吐（こども）': 51,
  '下痢（こども）': 52,
  '腹痛（こども）': 53,
  '便秘（こども）': 54,
  '便の色の異常（こども）': 55,
  '耳痛・耳だれ（こども）': 56,
  '頭痛（こども）': 57,
  '泣き止まない（こども）': 58,
  '頭のけが・首のけが（こども）': 59
}

interface SymptomAssessmentResponse {
  matched_categories: MatchedCategory[]
  is_child: boolean
}

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
      setLoading(false)
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
        throw new Error(`症状判定APIエラー: ${symptomAssessmentRes.status}`)
      }

      const symptomAssessmentData = await symptomAssessmentRes.json()
      console.log('Symptom Assessment Response:', symptomAssessmentData)

      // JSONデータを抽出して解析
      let parsedData: SymptomAssessmentResponse | null = null
      try {
        // Markdown形式のJSONを抽出
        const jsonMatch = symptomAssessmentData.answer.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          const jsonContent = jsonMatch[1].trim()
          console.log('Extracted JSON content:', jsonContent)
          parsedData = JSON.parse(jsonContent)
        } else {
          // Markdownでない場合は直接パース
          parsedData = JSON.parse(symptomAssessmentData.answer)
        }
        console.log('Parsed assessment data:', parsedData)
      } catch (error) {
        console.error('症状判定結果の解析に失敗しました:', error)
        throw new Error('症状判定結果の解析に失敗しました')
      }

      if (!parsedData) {
        throw new Error('症状判定結果が不正です')
      }

      // カテゴリーIDに変換
      const matchedCategoryIds = parsedData.matched_categories
        .map(mc => categoryMapping[mc.category])
        .filter(Boolean)

      if (matchedCategoryIds.length === 0) {
        console.log('マッチするカテゴリーが見つかりませんでした')
      }

      // 問診データを作成
      const interviewRes = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptom_text: symptomText,
          matched_categories: matchedCategoryIds,
          is_child: parsedData.is_child
        }),
      })

      if (!interviewRes.ok) {
        throw new Error('問診データの作成に失敗しました')
      }

      const interviewData = await interviewRes.json()
      console.log('Created interview data:', interviewData)

      // カテゴリーがマッチした場合は緊急度判定へ
      if (matchedCategoryIds.length > 0) {
        router.push(`/urgency-assessment?interview_id=${interviewData.interview_id}&category_id=${matchedCategoryIds[0]}`)
      } else {
        // カテゴリーがマッチしなかった場合は問診表を生成
        try {
          const questionnaireRes = await fetch('https://api.dify.ai/v1/completion-messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_QUESTION_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              inputs: {
                symptom: symptomText,
                is_child: parsedData.is_child
              },
              response_mode: "blocking",
              user: "anonymous"
            })
          })

          if (!questionnaireRes.ok) {
            console.error('問診表生成APIエラー:', await questionnaireRes.text())
            throw new Error('問診表の生成に失敗しました')
          }

          const questionnaireData = await questionnaireRes.json()
          console.log('Questionnaire Response:', questionnaireData)

          // 問診表データを解析
          let parsedQuestions = null
          try {
            const jsonMatch = questionnaireData.answer.match(/```json\n([\s\S]*?)\n```/)
            if (jsonMatch) {
              const jsonContent = jsonMatch[1].trim()
              console.log('Extracted questions JSON:', jsonContent)
              parsedQuestions = JSON.parse(jsonContent)
            } else {
              parsedQuestions = JSON.parse(questionnaireData.answer)
            }
            console.log('Parsed questions:', parsedQuestions)

            if (!parsedQuestions || !parsedQuestions.questions) {
              throw new Error('問診表データの形式が不正です')
            }
          } catch (error) {
            console.error('問診表データの解析に失敗しました:', error)
            throw new Error('問診表データの解析に失敗しました')
          }

          // 問診表データを保存
          const questionsArray = parsedQuestions.questions
          const questionUpdates = {
            question_1: questionsArray[0]?.text || null,
            question_2: questionsArray[1]?.text || null,
            question_3: questionsArray[2]?.text || null,
            question_4: questionsArray[3]?.text || null,
            question_5: questionsArray[4]?.text || null,
            question_6: questionsArray[5]?.text || null,
            questions: questionsArray, // 質問の詳細情報も保存
            updated_at: new Date().toISOString()
          }

          console.log('Saving questions with interview_id:', interviewData.interview_id)

          const { data: updateData, error: saveError } = await supabase
            .from('medical_interviews')
            .update(questionUpdates)
            .eq('id', interviewData.interview_id)
            .select()

          if (saveError) {
            console.error('問診表データの保存に失敗しました:', saveError)
            throw new Error('問診表データの保存に失敗しました')
          }

          console.log('Updated interview data:', updateData)

          // 問診ページへ遷移
          router.push(`/questionnaire?interview_id=${interviewData.interview_id}`)
        } catch (error) {
          console.error('問診表の生成中にエラーが発生しました:', error)
          setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
          scrollToSymptomInput()
        }
      }
    } catch (error) {
      console.error('エラーが発生しました:', error)
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
      scrollToSymptomInput()
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