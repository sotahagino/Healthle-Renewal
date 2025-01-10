"use client"

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseClient } from "@/lib/supabase"

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

      const parsedData = typeof decodedData === 'string' 
        ? JSON.parse(decodedData)
        : decodedData

      const questionData = Array.isArray(parsedData) 
        ? parsedData 
        : parsedData.questions || []

      setQuestions(questionData)
      
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((question, index) => (
          <Card key={question.id} className="w-full">
            <CardContent className="pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  {`${index + 1}. ${question.text}`}
                </h3>
                {renderQuestionInput(question, index)}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center">
          <Button
            type="submit"
            className="w-full max-w-md"
            disabled={isLoading}
          >
            {isLoading ? '送信中...' : '回答を送信'}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

