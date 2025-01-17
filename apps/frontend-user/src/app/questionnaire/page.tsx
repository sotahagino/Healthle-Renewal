"use client"

import { useEffect, useState, useRef } from 'react'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Send, AlertCircle } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseClient } from "@/lib/supabase"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

// APIから返される質問の型定義
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
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({})
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [symptomText, setSymptomText] = useState<string>('')
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const interview_id = searchParams.get('interview_id')
    if (interview_id) {
      setInterviewId(interview_id)
    } else {
      setError('問診IDが見つかりません')
      return
    }

    const data = searchParams.get('data')
    if (!data) {
      setError('質問データが見つかりません')
      return
    }

    try {
      const decodedData = decodeURIComponent(data)
      console.log('Decoded data:', decodedData)

      let parsedQuestions
      try {
        parsedQuestions = JSON.parse(decodedData)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('質問データの形式が不正です')
      }

      // 質問データの検証
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('質問データが配列ではありません')
      }

      // 必須フィールドの検証
      parsedQuestions.forEach((question, index) => {
        if (!question.id || !question.text || !question.type) {
          throw new Error(`質問${index + 1}に必須フィールドが不足しています`)
        }
        if (question.type !== '自由記述' && (!Array.isArray(question.options) || question.options.length === 0)) {
          throw new Error(`質問${index + 1}の選択肢が不正です`)
        }
      })

      setQuestions(parsedQuestions)
      
      // 回答の初期化
      const initialAnswers: { [key: string]: string | string[] } = {}
      parsedQuestions.forEach((q: Question) => {
        initialAnswers[q.id] = q.type === '複数選択' ? [] : ''
      })
      setAnswers(initialAnswers)

    } catch (err) {
      console.error('質問データ解析エラー:', err)
      setError(err instanceof Error ? err.message : '質問データの読み込みに失敗しました')
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [searchParams])

  useEffect(() => {
    const symptom = searchParams.get('symptom_text')
    if (symptom) {
      setSymptomText(decodeURIComponent(symptom))
    }
  }, [searchParams])

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
      
      // 回答が入力されたら次の質問にスクロール
      const currentIndex = questions.findIndex(q => q.id === questionId)
      if (currentIndex < questions.length - 1) {
        setTimeout(() => {
          questionRefs.current[currentIndex + 1]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }, 300)
      }

      return {
        ...prev,
        [questionId]: value
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit button clicked')
    
    const interview_id = searchParams.get('interview_id')
    if (!interview_id) {
      setError('問診IDが見つかりません')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 回答データを整形
      const answersArray = questions.map((q, index) => {
        const answer = answers[q.id]
        const answerText = answer ? 
          (Array.isArray(answer) ? answer.join(',') : answer.toString()) 
          : null
        
        // 選択肢の場合、選択されたoptionのtextを保存
        let displayAnswer = answerText
        if (q.type === '単一選択' || q.type === '複数選択' || q.type === 'スケール') {
          const selectedOptions = q.options
            .filter(opt => answerText?.includes(opt.id))
            .map(opt => opt.text)
          displayAnswer = selectedOptions.join(',')
        }

        return {
          [`question_${index + 1}`]: q.text,
          [`answer_${index + 1}`]: displayAnswer
        }
      }).reduce((acc, curr) => ({ ...acc, ...curr }), {})

      console.log('Saving answers:', answersArray)
      
      // 回答をDBに保存
      const supabaseClient = getSupabaseClient()
      const { data, error: updateError } = await supabaseClient
        .from('medical_interviews')
        .update({
          ...answersArray,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', interview_id)
        .select()

      if (updateError) {
        console.error('DB update error:', updateError)
        throw updateError
      }

      console.log('Save response:', data)

      // 結果画面へ遷移
      const encodedAnswers = encodeURIComponent(JSON.stringify(answersArray))
      router.push(`/result?interview_id=${interview_id}&answers=${encodedAnswers}`)
    } catch (error) {
      console.error('Error saving answers:', error)
      setError('回答の保存に失敗しました')
      setIsLoading(false)
    }
  }

  // 進捗状況の計算
  const calculateProgress = () => {
    const totalQuestions = questions.length
    if (totalQuestions === 0) return 0
    
    const answeredQuestions = Object.values(answers).filter(answer => 
      Array.isArray(answer) ? answer.length > 0 : answer !== ''
    ).length
    
    return (answeredQuestions / totalQuestions) * 100
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
              onBlur={() => handleAnswerChange(question.id, answers[question.id] as string || '')}
              placeholder="ここに回答を入力してください"
              className="min-h-[120px] mb-2 text-base border-2 border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84] transition-all duration-300"
            />
            <p className="text-sm text-text-secondary italic">
              ※ 未入力の場合は「特になし」として回答されます
            </p>
          </div>
        )
      case '単一選択':
        return (
          <RadioGroup
            value={answers[question.id] as string || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {Array.isArray(question.options) && question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <RadioGroupItem
                  value={option.id}
                  id={`${question.id}-${optionIndex}`}
                  className="text-accent border-2 border-[#A7D7C5] data-[state=checked]:border-accent data-[state=checked]:text-accent"
                />
                <Label 
                  htmlFor={`${question.id}-${optionIndex}`}
                  className="text-base cursor-pointer"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      case '複数選択':
        const selectedValues = (answers[question.id] as string[]) || []
        return (
          <div className="space-y-3">
            {Array.isArray(question.options) && question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <input
                  type="checkbox"
                  id={`${question.id}-${optionIndex}`}
                  checked={selectedValues.includes(option.id)}
                  onChange={() => handleAnswerChange(question.id, option.id)}
                  className="w-4 h-4 rounded border-2 border-[#A7D7C5] text-accent focus:ring-accent"
                />
                <label
                  htmlFor={`${question.id}-${optionIndex}`}
                  className="text-base cursor-pointer"
                >
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        )
      case 'スケール':
        const value = answers[question.id] ? parseInt(answers[question.id] as string) : 5
        return (
          <div className="space-y-6">
            <Slider
              value={[value]}
              min={1}
              max={10}
              step={1}
              onValueChange={(values) => handleAnswerChange(question.id, values[0].toString())}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-text-secondary px-2">
              <span>非常に悪い</span>
              <span>非常に良い</span>
            </div>
            <div className="flex justify-between px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <span
                  key={num}
                  className={cn(
                    "text-sm",
                    value === num ? "text-accent font-bold" : "text-text-secondary"
                  )}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] via-white to-[#F5F9F7]">
      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>戻る</span>
            </button>
            <Progress value={calculateProgress()} className="w-32 h-2" />
          </div>
        </div>
      </div>

      <main className="flex-grow container max-w-2xl mx-auto px-4 py-6">
        {error ? (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">エラーが発生しました</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((question, index) => (
            <Card 
              key={question.id} 
              className="transition-all duration-300 hover:shadow-md"
              ref={(el: HTMLDivElement | null) => {
                if (questionRefs.current) {
                  questionRefs.current[index] = el;
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-lg font-bold text-text-primary mb-2">
                      {question.text}
                    </h2>
                    {question.type === '複数選択' && (
                      <p className="text-sm text-text-secondary">
                        複数選択可能です
                      </p>
                    )}
                  </div>
                </div>

                <div className="pl-0">
                  {renderQuestionInput(question, index)}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="sticky bottom-6 left-0 right-0 px-4">
            <div className="max-w-2xl mx-auto">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white py-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>送信中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>回答を送信する</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

