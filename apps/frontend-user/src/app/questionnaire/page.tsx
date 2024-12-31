"use client"

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"

// APIから返される質問の型定義を修正
interface Option {
  id: string
  text: string
}

interface Question {
  id: string
  text: string
  type: '自由記述' | '単一選択' | '複数選択' | 'スケール'
  options: Option[]
}

export default function QuestionnairePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({})
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const consultation_id = searchParams.get('consultation_id')
    if (consultation_id) {
      setConsultationId(consultation_id)
    }
  }, [searchParams])

  useEffect(() => {
    try {
      const data = searchParams.get('data')
      if (!data) {
        setError('質問データが見つかりません')
        return
      }

      const decodedData = decodeURIComponent(data)
      console.log('Decoded data:', decodedData)

      // JSONデータをパースする前に文字列であることを確認
      const parsedData = typeof decodedData === 'string' 
        ? JSON.parse(decodedData)
        : decodedData

      // questionsデータの取得方法を修正
      const questionData = Array.isArray(parsedData) 
        ? parsedData 
        : parsedData.questions || []

      setQuestions(questionData)
      
      // 回答の初期状態を設定
      const initialAnswers: { [key: string]: string | string[] } = {}
      questionData.forEach((q: Question) => {
        initialAnswers[q.id] = q.type === '複数選択' ? [] : ''
      })
      setAnswers(initialAnswers)

    } catch (err) {
      console.error('質問データ解析エラー:', err)
      setError('質問データの読み込みに失敗しました')
    }
  }, [searchParams])

  // エラー状態が変��されたときにスクロールする
  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [error])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => {
      const question = questions.find(q => q.id === questionId)
      if (question?.type === '複数選択') {
        const prevAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : []
        if (prevAnswers.includes(value)) {
          return {
            ...prev,
            [questionId]: prevAnswers.filter(v => v !== value)
          }
        } else {
          return {
            ...prev,
            [questionId]: [...prevAnswers, value]
          }
        }
      }
      return {
        ...prev,
        [questionId]: value
      }
    })
  }

  const handleSubmit = async () => {
    try {
      setError(null)

      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultation_id: consultationId,
          questions,
          answers,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('既に回答済みの質問票です')
          return
        }
        throw new Error(data.error || '回答の保存に失敗しました')
      }

      // 結果画面への遷移
      router.push(`/result?consultation_id=${consultationId}`)

    } catch (err) {
      console.error('回答送信エラーの詳細:', err)
      setError(err instanceof Error ? err.message : '回答の送信に失敗しました')
    }
  }

  const renderQuestionInput = (question: Question, index: number) => {
    if (!question || typeof question !== 'object') {
      console.error('Invalid question:', question)
      return null
    }

    switch (question.type) {
      case '自由記述':
        return (
          <div>
            <Textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="ここに回答を入力してください"
              className="min-h-[100px] mb-2"
            />
            <p className="text-sm text-gray-500 italic">
              ※ 未入力の場合は「特になし」として回答されます
            </p>
          </div>
        )
      case '単一選択':
      case 'スケール':
        return (
          <RadioGroup
            value={answers[question.id] as string || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {Array.isArray(question.options) && question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.id}
                  id={`${question.id}-${optionIndex}`}
                />
                <Label htmlFor={`${question.id}-${optionIndex}`}>
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      case '複数選択':
        const selectedValues = (answers[question.id] as string[]) || []
        return (
          <div className="space-y-2">
            {Array.isArray(question.options) && question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${question.id}-${optionIndex}`}
                  checked={selectedValues.includes(option.id)}
                  onChange={() => handleAnswerChange(question.id, option.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={`${question.id}-${optionIndex}`}>
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
            <h1 className="text-2xl font-bold">質問票</h1>
          </div>

          {error && (
            <div 
              ref={errorRef}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
            >
              {error}
            </div>
          )}

          <div className="space-y-8">
            {questions.map((question, index) => (
              <Card key={question.id} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Q{index + 1}. {question.text}
                    </h3>
                    {renderQuestionInput(question, index)}
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length > 0 && (
              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleSubmit}
                  className="bg-[#3A8B73] hover:bg-[#2E7A62] text-white px-8 py-2"
                >
                  回答を送信
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">質問票</h1>
        </div>

        <div className="space-y-8">
          {questions.map((question, index) => (
            <Card key={question.id} className="shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Q{index + 1}. {question.text}
                  </h3>
                  {renderQuestionInput(question, index)}
                </div>
              </CardContent>
            </Card>
          ))}

          {questions.length > 0 && (
            <div className="flex justify-end mt-8">
              <Button
                onClick={handleSubmit}
                className="bg-[#3A8B73] hover:bg-[#2E7A62] text-white px-8 py-2"
              >
                回答を送信
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

