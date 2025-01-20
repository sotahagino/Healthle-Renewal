'use client'

import { useEffect, useState } from 'react'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

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

export default function UrgencyAssessment() {
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

    if (categoryId) {
      fetchQuestions()
    }
  }, [categoryId])

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
        throw new Error('緊急度判定の保存に失敗しました')
      }

      // すべての重症度でmedical画面に遷移
      router.push(`/medical?interview_id=${interviewId}&urgency_level=${urgencyLevel}`)

    } catch (error) {
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">症状チェック</h1>
          <p className="text-gray-500 text-sm mb-8">該当する症状をすべてチェックしてください。</p>

          {/* 症状グループ */}
          {Object.entries(questionGroups).map(([urgencyLevel, group]) => (
            <div key={urgencyLevel} className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                {group.title}
              </h2>
              <p className="text-gray-600 text-sm mb-4">{group.description}</p>
              <div className="space-y-4">
                {group.questions.filter(q => !q.is_escalator).map((question) => (
                  <div key={question.id} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                    <Checkbox
                      id={`question-${question.id}`}
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={(checked) => handleQuestionChange(question.id, checked)}
                    />
                    <label
                      htmlFor={`question-${question.id}`}
                      className="flex-1 text-gray-700 leading-relaxed cursor-pointer"
                    >
                      {question.question_text}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* その他の質問（エスカレーター質問） */}
          {questions.some(q => q.is_escalator) && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">その他の質問</h2>
              <div className="space-y-4">
                {questions.filter(q => q.is_escalator).map((question) => (
                  <div key={question.id} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                    <Checkbox
                      id={`question-${question.id}`}
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={(checked) => handleQuestionChange(question.id, checked)}
                    />
                    <label
                      htmlFor={`question-${question.id}`}
                      className="flex-1 text-gray-700 leading-relaxed cursor-pointer"
                    >
                      {question.question_text}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto bg-primary text-white font-medium px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '送信中...' : '送信する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 