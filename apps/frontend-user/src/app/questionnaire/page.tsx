"use client"

import { useEffect, useState, useRef, Suspense } from 'react'
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
  scale_definition?: {
    min: string
    max: string
  }
  hasOther?: boolean  // その他オプションの有無
}

// 禁止事項判定APIのレスポンス型
interface ProhibitedContentResponse {
  problem: boolean
}

// 回答の型定義
type AnswerValue = string | string[] | { value: string | string[], otherText?: string }
type Answers = { [key: string]: AnswerValue }

// 回答データの型定義を追加
interface FormattedAnswers {
  [key: string]: string;
}

// 禁止事項判定APIを呼び出す関数
const checkProhibitedContent = async (symptomText: string, formattedAnswers: Record<string, string>) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/completion-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_PROHIBITED_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          symptom: symptomText,
          answers: formattedAnswers
        },
        response_mode: "blocking",
        user: "user"
      }),
    })

    if (!response.ok) {
      throw new Error('禁止事項判定APIの呼び出しに失敗しました')
    }

    const data = await response.json()
    console.log('Prohibited Content API Response:', data)

    if (!data || !data.answer) {
      throw new Error('APIレスポンスの形式が不正です')
    }

    try {
      // まず、```json```で囲まれた部分を探す
      const jsonMatch = data.answer.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]) as ProhibitedContentResponse
      }

      // 次に、単純なJSONテキストとして解析を試みる
      const jsonObject = JSON.parse(data.answer) as ProhibitedContentResponse
      if (jsonObject && typeof jsonObject === 'object') {
        return jsonObject
      }

      throw new Error('JSONの解析に失敗しました')
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('禁止事項判定結果の解析に失敗しました')
    }
  } catch (error) {
    console.error('Prohibited Content API error:', error)
    throw new Error('禁止事項の判定に失敗しました')
  }
}

function QuestionnaireContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answers>({})
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true)
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

    const fetchQuestions = async () => {
      try {
        setIsQuestionsLoading(true)
        console.log('Fetching questions for interview_id:', interview_id)
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('medical_interviews')
          .select('questions, status')
          .eq('id', interview_id)
          .single()

        console.log('Supabase response:', { data, error })

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        // 質問票がまだ生成されていない場合
        if (!data?.questions || data.status === 'pending') {
          // 3秒後に再度チェック
          setTimeout(() => fetchQuestions(), 3000)
          return
        }

        const parsedQuestions = data.questions
        console.log('Parsed questions:', parsedQuestions)

        // 質問データの検証
        if (!Array.isArray(parsedQuestions)) {
          console.error('Questions is not an array:', parsedQuestions)
          throw new Error('質問データが配列ではありません')
        }

        // 必須フィールドの検証
        parsedQuestions.forEach((question, index) => {
          if (!question.id || !question.text || !question.type) {
            throw new Error(`質問${index + 1}に必須フィールドが不足しています`)
          }
          // スケール質問の場合はscale_definitionが必要
          if (question.type === 'スケール') {
            if (!question.scale_definition?.min || !question.scale_definition?.max) {
              throw new Error(`質問${index + 1}のスケール定義が不正です`)
            }
          }
          // 単一選択と複数選択の場合は選択肢が必要
          else if (question.type !== '自由記述' && (!Array.isArray(question.options) || question.options.length === 0)) {
            throw new Error(`質問${index + 1}の選択肢が不正です`)
          }
        })

        setQuestions(parsedQuestions)
        
        // 回答の初期化
        const initialAnswers: Answers = {}
        parsedQuestions.forEach((q: Question) => {
          initialAnswers[q.id] = q.type === '複数選択' ? { value: [] } : { value: '' }
        })
        setAnswers(initialAnswers)
        setIsQuestionsLoading(false)

      } catch (err) {
        console.error('質問データ取得エラー:', err)
        setError(err instanceof Error ? err.message : '質問データの読み込みに失敗しました')
        if (errorRef.current) {
          errorRef.current.scrollIntoView({ behavior: 'smooth' })
        }
        setIsQuestionsLoading(false)
      }
    }

    fetchQuestions()
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

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => {
      const question = questions.find(q => q.id === questionId)
      if (!question) return prev

      // 自動スクロールの条件を設定
      const shouldAutoScroll = () => {
        // 複数選択の場合はスクロールしない
        if (question.type === '複数選択') return false
        
        // 単一選択で「その他」が選択された場合はスクロールしない
        if (question.type === '単一選択' && 
            typeof value === 'object' && 
            'value' in value && 
            question.options.find(opt => opt.text === 'その他')?.id === value.value) {
          return false
        }
        
        return true
      }

      // 条件を満たす場合のみ次の質問にスクロール
      const currentIndex = questions.findIndex(q => q.id === questionId)
      if (currentIndex < questions.length - 1 && shouldAutoScroll()) {
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
    setIsLoading(true)
    setError(null)

    if (!interviewId) {
      setError('問診IDが見つかりません')
      setIsLoading(false)
      return
    }

    try {
      // Supabaseからsymptom_textを取得
      const supabaseClient = getSupabaseClient()
      const { data: interviewData, error: fetchError } = await supabaseClient
        .from('medical_interviews')
        .select('symptom_text')
        .eq('id', interviewId)
        .single()

      if (fetchError) {
        console.error('Symptom text fetch error:', fetchError)
        throw new Error('相談内容の取得に失敗しました')
      }

      if (!interviewData?.symptom_text) {
        throw new Error('相談内容が見つかりません')
      }

      // 回答データの整形
      const formattedAnswers: FormattedAnswers = Object.entries(answers).reduce((acc, [questionId, answer]) => {
        const question = questions.find(q => q.id === questionId)
        if (!question) return acc

        let displayAnswer: string | null = null

        if (typeof answer === 'object' && 'value' in answer) {
          if (question.type === '単一選択') {
            if (answer.value === 'other') {
              displayAnswer = answer.otherText || '未入力'
            } else {
              const option = question.options.find(opt => opt.id === answer.value)
              displayAnswer = option?.text || ''
            }
          } else if (question.type === '複数選択') {
            const selectedOptions = (answer.value as string[])
            const selectedTexts = selectedOptions
              .filter(id => id !== 'other')
              .map(id => question.options.find(opt => opt.id === id)?.text || '')
            
            if (selectedOptions.includes('other') && answer.otherText) {
              selectedTexts.push(answer.otherText)
            }
            displayAnswer = selectedTexts.join(',')
          } else {
            displayAnswer = answer.value.toString()
          }
        } else {
          displayAnswer = Array.isArray(answer) ? answer.join(',') : answer.toString()
        }

        // 質問番号を抽出（例: q1 -> 1）
        const questionNumber = questionId.replace(/\D/g, '')
        return {
          ...acc,
          [`question_${questionNumber}`]: question.text,
          [`answer_${questionNumber}`]: displayAnswer || '',
        }
      }, {} as FormattedAnswers)

      // 禁止事項判定を実行
      const questionsAndAnswers = Object.entries(formattedAnswers)
        .filter(([key]) => key.startsWith('question_'))
        .map(([key, value]) => {
          const answerKey = `answer_${key.replace('question_', '')}`
          return `${value}：${formattedAnswers[answerKey] || ''}`
        })
        .join('\n')

      const prohibitedContentResponse = await checkProhibitedContent(
        `相談内容：${interviewData.symptom_text}\n\n質問と回答：\n${questionsAndAnswers}`,
        formattedAnswers
      )

      // JSONBデータの準備
      const jsonbAnswers = Object.entries(answers).reduce((acc, [questionId, answer]) => {
        const question = questions.find(q => q.id === questionId)
        if (!question) return acc

        return {
          ...acc,
          [questionId]: {
            question: question.text,
            answer: typeof answer === 'object' && 'value' in answer ? answer.value : answer,
            type: question.type,
            otherText: typeof answer === 'object' && 'value' in answer ? answer.otherText : undefined
          }
        }
      }, {})

      // 回答をDBに保存
      const { error: updateError } = await supabaseClient
        .from('medical_interviews')
        .update({
          ...formattedAnswers,  // 個別のカラムに保存
          answers: jsonbAnswers, // JSONB形式でも保存
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId)

      if (updateError) {
        console.error('DB update error:', updateError)
        throw updateError
      }

      const encodedAnswers = encodeURIComponent(JSON.stringify(formattedAnswers))
      
      if (prohibitedContentResponse.problem) {
        // 禁止事項に該当する場合は、黄色判定で精神科・心療内科を推奨
        const triageData = {
          triageResult: 'medical_consultation',
          reason: '精神的なケアが必要と判断されました',
          recommendedSpecialty: '精神科,心療内科'
        }
        const encodedTriageData = encodeURIComponent(JSON.stringify(triageData))
        router.push(`/medical?interview_id=${interviewId}&answers=${encodedAnswers}&triage=${encodedTriageData}&urgency_level=yellow`)
      } else {
        // 問題がない場合はresult画面に遷移
        router.push(`/result?interview_id=${interviewId}&answers=${encodedAnswers}`)
      }

    } catch (err) {
      console.error('回答送信エラー:', err)
      setError(err instanceof Error ? err.message : '回答の送信に失敗しました')
      if (errorRef.current) {
        errorRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 進捗状況の計算
  const calculateProgress = () => {
    const totalQuestions = questions.length
    if (totalQuestions === 0) return 0
    
    const answeredQuestions = Object.values(answers).filter(answer => {
      if (typeof answer === 'object' && 'value' in answer) {
        return Array.isArray(answer.value) ? answer.value.length > 0 : answer.value !== ''
      }
      return Array.isArray(answer) ? answer.length > 0 : answer !== ''
    }).length
    
    return (answeredQuestions / totalQuestions) * 100
  }

  const renderQuestionInput = (question: Question, index: number) => {
    if (!question || typeof question !== 'object') {
      console.error('Invalid question:', question)
      return null
    }

    switch (question.type) {
      case '自由記述':
        const freeAnswer = answers[question.id] || ''
        return (
          <div>
            <Textarea
              value={typeof freeAnswer === 'string' ? freeAnswer : ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              onBlur={() => {
                const currentAnswer = answers[question.id]
                handleAnswerChange(question.id, typeof currentAnswer === 'string' ? currentAnswer : '')
              }}
              placeholder="ここに回答を入力してください"
              className="min-h-[120px] mb-2 text-base border-2 border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84] transition-all duration-300"
            />
            <p className="text-sm text-text-secondary italic">
              ※ 未入力の場合は「特になし」として回答されます
            </p>
          </div>
        )
      case '単一選択':
        const answer = answers[question.id] as { value: string, otherText?: string } || { value: '' }
        const hasOtherOption = question.options.some(opt => opt.text === 'その他')
        return (
          <div className="space-y-4">
            <RadioGroup
              value={answer.value}
              onValueChange={(value) => handleAnswerChange(question.id, { ...answer, value })}
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
            {hasOtherOption && answer.value === question.options.find(opt => opt.text === 'その他')?.id && (
              <Textarea
                value={answer.otherText || ''}
                onChange={(e) => handleAnswerChange(question.id, { ...answer, otherText: e.target.value })}
                placeholder="その他の回答を入力してください"
                className="min-h-[80px] mb-2 text-base border-2 border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84] transition-all duration-300"
              />
            )}
          </div>
        )
      case '複数選択':
        const multiAnswer = answers[question.id] as { value: string[], otherText?: string } || { value: [] }
        const hasMultiOtherOption = question.options.some(opt => opt.text === 'その他')
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {Array.isArray(question.options) && question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <input
                    type="checkbox"
                    id={`${question.id}-${optionIndex}`}
                    checked={multiAnswer.value.includes(option.id)}
                    onChange={() => {
                      const newValue = multiAnswer.value.includes(option.id)
                        ? multiAnswer.value.filter(v => v !== option.id)
                        : [...multiAnswer.value, option.id]
                      handleAnswerChange(question.id, { ...multiAnswer, value: newValue })
                    }}
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
            {hasMultiOtherOption && multiAnswer.value.includes(question.options.find(opt => opt.text === 'その他')?.id || '') && (
              <Textarea
                value={multiAnswer.otherText || ''}
                onChange={(e) => handleAnswerChange(question.id, { ...multiAnswer, otherText: e.target.value })}
                placeholder="その他の回答を入力してください"
                className="min-h-[80px] mb-2 text-base border-2 border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84] transition-all duration-300"
              />
            )}
          </div>
        )
      case 'スケール':
        const scaleValue = answers[question.id]
        const numericValue = typeof scaleValue === 'string' ? parseInt(scaleValue) : 5

        // scale_definitionから最小値と最大値の説明を取得
        const minLabel = question.scale_definition?.min.replace(/^1は/, '') || '非常に悪い'
        const maxLabel = question.scale_definition?.max.replace(/^10は/, '') || '非常に良い'

        return (
          <div className="space-y-6">
            <Slider
              value={[numericValue]}
              min={1}
              max={10}
              step={1}
              onValueChange={(values) => handleAnswerChange(question.id, values[0].toString())}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-text-secondary px-2">
              <span>{minLabel}</span>
              <span>{maxLabel}</span>
            </div>
            <div className="flex justify-between px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <span
                  key={num}
                  className={cn(
                    "text-sm",
                    numericValue === num ? "text-accent font-bold" : "text-text-secondary"
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
        {isQuestionsLoading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-gray-600 font-medium">質問票を準備しています...</p>
              <p className="text-sm text-gray-500 mt-2">しばらくお待ちください</p>
            </div>
          </div>
        ) : error ? (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">エラーが発生しました</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </main>
    </div>
  )
}

export default function QuestionnairePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3EF] via-white to-[#F5F9F7]">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">質問を読み込んでいます...</p>
          </div>
        </div>
      }>
        <QuestionnaireContent />
      </Suspense>
    </div>
  )
}

