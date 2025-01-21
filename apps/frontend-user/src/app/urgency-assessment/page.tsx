'use client'

import { useEffect, useState, Suspense } from 'react'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'

interface UrgencyQuestion {
  id: number
  question_text: string
  urgency_level: 'red' | 'yellow' | 'green' | 'white'
  recommended_departments: string[] | null
  display_order: number
  is_escalator: boolean
}

interface QuestionGroup {
  urgency_level: 'red' | 'yellow' | 'green'
  questions: UrgencyQuestion[]
  title: string
  description: string
}

function UrgencyAssessmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<UrgencyQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([])
  const [currentUrgencyLevel, setCurrentUrgencyLevel] = useState<string | null>(null)

  const categoryId = searchParams.get('category_id')
  const interviewId = searchParams.get('interview_id')

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (!categoryId) {
          router.push('/')
          return
        }

        // interview_idがない場合は新規作成
        if (!interviewId || interviewId === 'undefined') {
          try {
            const res = await fetch('/api/interviews', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                symptom_text: `カテゴリー${categoryId}からの緊急度判定`,
                matched_categories: [],
                is_child: false
              }),
            })

            if (!res.ok) {
              const errorData = await res.json()
              throw new Error(errorData.error || 'インタビューの作成に失敗しました')
            }

            const data = await res.json()
            console.log('Created new interview:', data)
            
            // 新しいURLに置き換える（現在のページを新しいインタビューIDで更新）
            const newUrl = `/urgency-assessment?interview_id=${data.interview_id}&category_id=${categoryId}`
            router.replace(newUrl)
            return
          } catch (error) {
            console.error('Error creating interview:', error)
            setError('インタビューの作成に失敗しました')
            return
          }
        }

        const res = await fetch(`/api/urgency-questions?category_id=${categoryId}`)
        if (!res.ok) {
          throw new Error('質問の取得に失敗しました')
        }
        const data = await res.json()
        setQuestions(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [categoryId, interviewId, router])

  const questionGroups: QuestionGroup[] = [
    {
      urgency_level: 'red',
      title: '重要な症状',
      description: '以下の症状がある場合は、直ちに救急車を呼ぶ必要があるかもしれません。',
      questions: questions.filter(q => q.urgency_level === 'red')
    },
    {
      urgency_level: 'yellow',
      title: '一般的な症状',
      description: '以下の症状がある場合は、できるだけ早く（当日中に）受診することをお勧めします。',
      questions: questions.filter(q => q.urgency_level === 'yellow')
    },
    {
      urgency_level: 'green',
      title: '付随する症状',
      description: '以下の症状がある場合は、様子を見ながら受診を検討してください。',
      questions: questions.filter(q => q.urgency_level === 'green')
    }
  ]

  const handleQuestionChange = (questionId: number, checked: boolean | string) => {
    setSelectedQuestions(prev => {
      if (checked === true) {
        return [...prev, questionId]
      } else {
        return prev.filter(id => id !== questionId)
      }
    })
  }

  const determineUrgencyLevel = () => {
    const selectedQuestionData = questions.filter(q => selectedQuestions.includes(q.id))
    
    // エスカレーター質問がチェックされているか確認
    const hasEscalator = selectedQuestionData.some(q => q.is_escalator)
    
    // 基本の緊急度を判定
    let baseUrgencyLevel = 'white'
    if (selectedQuestionData.some(q => q.urgency_level === 'red')) {
      baseUrgencyLevel = 'red'
    } else if (selectedQuestionData.some(q => q.urgency_level === 'yellow')) {
      baseUrgencyLevel = 'yellow'
    } else if (selectedQuestionData.some(q => q.urgency_level === 'green')) {
      baseUrgencyLevel = 'green'
    }

    // エスカレーター質問がチェックされている場合、緊急度を上げる
    if (hasEscalator) {
      switch (baseUrgencyLevel) {
        case 'yellow':
          return 'red'
        case 'green':
          return 'yellow'
        case 'white':
          return 'green'
        default:
          return baseUrgencyLevel
      }
    }

    return baseUrgencyLevel
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!interviewId || interviewId === 'undefined') {
        throw new Error('セッションの有効期限が切れました。最初からやり直してください。')
      }

      if (!categoryId || categoryId === 'undefined') {
        throw new Error('カテゴリーIDが不正です。最初からやり直してください。')
      }

      if (selectedQuestions.length === 0) {
        setError('少なくとも1つの症状を選択してください')
        return
      }

      const urgencyLevel = determineUrgencyLevel()
      setCurrentUrgencyLevel(urgencyLevel)

      // 選択された質問から推奨診療科を取得
      const selectedQuestionData = questions.filter(q => selectedQuestions.includes(q.id))
      const recommendedDepartments = Array.from(new Set(
        selectedQuestionData
          .map(q => q.recommended_departments)
          .filter(Boolean)
          .flat()
      ))

      const res = await fetch('/api/urgency-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interview_id: interviewId,
          category_id: categoryId,
          matched_question_ids: selectedQuestions,
          urgency_level: urgencyLevel,
          recommended_departments: recommendedDepartments
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || '緊急度判定の保存に失敗しました')
      }

      const data = await res.json()
      console.log('Urgency assessment saved:', data)

      // すべての重症度でmedical画面に遷移
      router.push(`/medical?interview_id=${interviewId}&urgency_level=${urgencyLevel}`)

    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
      // エラーメッセージを表示する位置までスクロール
      const errorElement = document.getElementById('error-message')
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="text-red-500">{error}</div>
    </div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>ホームに戻る</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">症状チェック</h1>
                <p className="text-gray-600 text-sm md:text-base">
                  該当する症状をチェックしてください
                </p>
              </div>

              {error && (
                <div 
                  id="error-message"
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 md:space-y-6">
                {questionGroups.map((group) => (
                  <div 
                    key={group.urgency_level}
                    className={`rounded-xl p-4 md:p-6 ${
                      group.urgency_level === 'red' 
                        ? 'bg-red-50/50 border border-red-100' 
                        : group.urgency_level === 'yellow'
                        ? 'bg-yellow-50/50 border border-yellow-100'
                        : 'bg-green-50/50 border border-green-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <h2 className={`text-base md:text-lg font-bold ${
                        group.urgency_level === 'red'
                          ? 'text-red-700'
                          : group.urgency_level === 'yellow'
                          ? 'text-yellow-700'
                          : 'text-green-700'
                      }`}>
                        {group.title}
                      </h2>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      {group.questions.filter(q => !q.is_escalator).map((question) => (
                        <div 
                          key={question.id} 
                          className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer group min-h-[3.5rem]"
                          onClick={() => handleQuestionChange(question.id, !selectedQuestions.includes(question.id))}
                        >
                          <Checkbox
                            id={`question-${question.id}`}
                            checked={selectedQuestions.includes(question.id)}
                            onCheckedChange={(checked) => handleQuestionChange(question.id, checked)}
                            className={`h-5 w-5 rounded-sm border-2 ${
                              selectedQuestions.includes(question.id)
                                ? group.urgency_level === 'red'
                                  ? 'border-red-500 bg-red-500 text-white'
                                  : group.urgency_level === 'yellow'
                                  ? 'border-yellow-500 bg-yellow-500 text-white'
                                  : 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300'
                            } transition-colors duration-200`}
                          />
                          <label
                            htmlFor={`question-${question.id}`}
                            className="flex-1 text-gray-700 text-sm md:text-base leading-relaxed cursor-pointer"
                          >
                            {question.question_text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {questions.some(q => q.is_escalator) && (
                <div className="mt-4 md:mt-6 rounded-xl p-4 md:p-6 bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <h2 className="text-base md:text-lg font-bold text-blue-700">その他の症状</h2>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    {questions.filter(q => q.is_escalator).map((question) => (
                      <div 
                        key={question.id} 
                        className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer group min-h-[3.5rem]"
                        onClick={() => handleQuestionChange(question.id, !selectedQuestions.includes(question.id))}
                      >
                        <Checkbox
                          id={`question-${question.id}`}
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={(checked) => handleQuestionChange(question.id, checked)}
                          className="h-5 w-5 rounded-sm border-2 border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 text-white"
                        />
                        <label
                          htmlFor={`question-${question.id}`}
                          className="flex-1 text-gray-700 text-sm md:text-base leading-relaxed cursor-pointer"
                        >
                          {question.question_text}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 md:mt-8 flex justify-center px-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base md:text-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>判定中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>症状を判定する</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function UrgencyAssessment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UrgencyAssessmentContent />
    </Suspense>
  )
} 