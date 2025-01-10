"use client"

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, ShoppingBag, ArrowRight, CheckCircle, Star, HelpCircle, Phone } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Provider } from '@supabase/supabase-js'
import { useAuth } from '@/providers/auth-provider'

// Supabaseクライアントの初期化
const supabase = createClientComponentClient()

interface Question {
  id: string
  question_text: string
  question: string
  type: string
  answer?: string
  options?: Array<{
    id: string
    text: string
  }>
}

interface ChatMessage {
  type: 'initial' | 'question' | 'answer' | 'error'
  text: string
}

// 商品レコメンド用の型定義
type RecommendedProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

type DifyProductResponse = {
  recommended_products: { product_id: string }[];
};

interface FollowUpData {
  question: string;
  answer: string;
  created_at: string;
}

export default function ResultPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [consultationText, setConsultationText] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<RecommendedProduct | null>(null)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [response, setResponse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const responseRef = useRef<HTMLDivElement>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const interviewId = searchParams.get('interview_id')
        if (!interviewId) {
          // 相談情報がない場合は新規作成
          const tempUid = !user ? crypto.randomUUID() : user.id
          if (!user) {
            localStorage.setItem('temp_uid', tempUid)
          }

          const response = await fetch('/api/interviews/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: tempUid,
              consultation_text: searchParams.get('symptom_text') || '',
              questions: []
            })
          })

          if (!response.ok) {
            throw new Error('相談情報の保存に失敗しました')
          }

          const data = await response.json()
          setInterviewId(data.id)
          return
        }

        // 既存の相談情報を取得
        const { data: interviewData, error } = await supabase
          .from('medical_interviews')
          .select('*')
          .eq('id', interviewId)
          .single()

        if (error) throw error

        // 相談情報をステートに設定
        setConsultationText(interviewData.consultation_text || '')
        setQuestions(interviewData.questions_and_answers || [])
        setInterviewId(interviewData.id)

        // チャット履歴の初期化
        const initialHistory: ChatMessage[] = []

        // 既存の回答がある場合は表示
        if (interviewData.ai_response_text) {
          initialHistory.push({ type: 'initial', text: interviewData.ai_response_text })
          setResponse(interviewData.ai_response_text)
        }

        // 追加の会話履歴がある場合は追加
        if (interviewData.interview_conversations) {
          interviewData.interview_conversations.forEach((conv: { question: string; answer: string }) => {
            initialHistory.push(
              { type: 'question', text: conv.question },
              { type: 'answer', text: conv.answer }
            )
          })
        }

        setChatHistory(initialHistory)

        // 商品提案APIを呼び出し
        setIsLoadingProducts(true)
        try {
          const questions = []
          for (let i = 1; i <= 10; i++) {
            const question = interviewData[`question_${i}`]
            const answer = interviewData[`answer_${i}`]
            if (question) {
              questions.push({
                question: question,
                answer: answer || ''
              })
            }
          }

          const messagePayload = {
            symptom: interviewData.symptom_text || '',
            questions: questions
          }

          console.log('Message Payload:', messagePayload)

          const products = await fetchProductRecommendations(messagePayload.symptom, questions)
          setRecommendedProducts(products)

          // レコメンド結果を保存
          if (products && products.length > 0) {
            await saveRecommendations(interviewId, products)
          }
        } catch (error) {
          console.error('Error in product recommendations:', error)
          setProductError('商品提案の取得に失敗しました')
        } finally {
          setIsLoadingProducts(false)
        }

        // 回答がない場合のみAPIを呼び出し
        if (!interviewData.ai_response_text) {
          // 回答データを整形
          const answers: Record<string, string> = {}
          for (let i = 1; i <= 10; i++) {
            const question = interviewData[`question_${i}`]
            const answer = interviewData[`answer_${i}`]
            if (question) {
              answers[`question_${i}`] = question
              answers[`answer_${i}`] = answer || ''
            }
          }

          // APIにリクエストを送信
          await handleStreamingAnswer(interviewData.symptom_text || '', answers)
        }

      } catch (error) {
        console.error('Error in fetchData:', error)
        setError(error instanceof Error ? error.message : 'データの取得に失敗しました')
      }
    }

    fetchData()
  }, [searchParams, user])

  const handleStreamingAnswer = async (symptomText: string, answers: Record<string, string>) => {
    try {
      setIsStreaming(true)
      setResponse('')
      let fullResponse = ''

      // 質問と回答のペアを作成
      const formattedAnswers = Object.entries(answers)
        .filter(([key]) => key.startsWith('question_') || key.startsWith('answer_'))
        .reduce((acc, [key, value]) => {
          const index = key.split('_')[1]
          if (key.startsWith('question_')) {
            acc[index] = { ...acc[index], question: value }
          } else {
            acc[index] = { ...acc[index], answer: value || '' }
          }
          return acc
        }, {} as Record<string, { question: string; answer: string }>)

      const messagePayload = {
        symptom: symptomText,
        questions: Object.values(formattedAnswers)
          .filter(qa => qa.question && qa.answer)
          .map(qa => ({
            question: qa.question,
            answer: qa.answer
          }))
      }

      console.log('Sending to Dify API:', messagePayload)

      const response = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_ANSWER_API_KEY}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: JSON.stringify(messagePayload),
          response_mode: "streaming",
          conversation_id: "",
          user: "user-123",
          files: []
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let conversationId = null

      // チャット履歴に初期メッセージを追加
      setChatHistory([{ type: 'initial', text: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim()
            if (jsonStr !== '[DONE]') {
              try {
                const jsonData = JSON.parse(jsonStr)
                console.log('Streaming response data:', jsonData)

                if (!conversationId && jsonData.conversation_id) {
                  conversationId = jsonData.conversation_id
                }

                if (jsonData.event === 'message' && jsonData.answer) {
                  fullResponse += jsonData.answer
                  setResponse(fullResponse)
                  // ストリーミング中もチャット履歴を更新
                  setChatHistory(prev => {
                    const newHistory = [...prev]
                    if (newHistory.length > 0) {
                      newHistory[0] = { type: 'initial', text: fullResponse }
                    }
                    return newHistory
                  })
                }
              } catch (err) {
                console.error('JSON parse error:', err)
              }
            }
          }
        }
      }

      reader.releaseLock()

      // 回答を保存
      if (fullResponse) {
        const interview_id = searchParams.get('interview_id')
        const { error: updateError } = await supabase
          .from('medical_interviews')
          .update({
            ai_response_text: fullResponse,
            conversation_id: conversationId,
            last_response_at: new Date().toISOString()
          })
          .eq('id', interview_id)

        if (updateError) {
          console.error('Error saving response:', updateError)
        }
      }

    } catch (error) {
      console.error('Streaming error:', error)
      setError(error instanceof Error ? error.message : '回答の生成に失敗しました')
      // エラー時のチャット履歴更新
      setChatHistory(prev => [...prev, { type: 'error', text: 'エラーが発生しました。もう一度お試しください。' }])
    } finally {
      setIsStreaming(false)
    }
  }

  // 商品提案APIを呼び出す関数
  const fetchProductRecommendations = async (symptomText: string, questions: Array<{ question: string; answer: string }>) => {
    try {
      const messagePayload = {
        symptom: symptomText,
        questions: questions
      }

      const requestBody = {
        inputs: { symptom: JSON.stringify(messagePayload) },
        response_mode: 'blocking',
        user: 'user-123'
      }

      console.log('Product API Request Body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/completion-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_PRODUCT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('商品提案APIの呼び出しに失敗しました')
      }

      const data = await response.json()
      console.log('Product API Response:', data)

      let recommendData: DifyProductResponse
      try {
        // レスポンスがJSONでない場合は空の配列を返す
        if (typeof data.answer !== 'string' || !data.answer.includes('recommended_products')) {
          console.log('Invalid response format:', data.answer)
          return []
        }

        const answerText = data.answer.replace(/```json\n|\n```/g, '').trim()
        recommendData = JSON.parse(answerText)
        console.log('Parsed product recommendations:', recommendData)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        return []  // エラー時は空の配列を返す
      }

      if (!recommendData.recommended_products?.length) {
        return []
      }

      // Supabaseから商品情報を取得
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, description, price, image_url')
        .in('id', recommendData.recommended_products.map(p => p.product_id))
        .eq('status', 'on_sale')

      if (error) {
        throw error
      }

      return products as RecommendedProduct[]
    } catch (error) {
      console.error('商品提案の取得に失敗:', error)
      return []  // エラー時は空の配列を返す
    }
  }

  // 商品レコメンドの保存処理を追加
  const saveRecommendations = async (interview_id: string, products: RecommendedProduct[]) => {
    try {
      const { error } = await supabase
        .from('interview_recommendations')
        .insert([{
          interview_id,
          recommended_products: products,
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error saving recommendations:', error)
      }
    } catch (error) {
      console.error('Error in saveRecommendations:', error)
    }
  }

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followUpQuestion.trim()) return

    const interview_id = searchParams.get('interview_id')
    if (!interview_id) return

    try {
      setIsStreaming(true)
      setChatHistory(prev => [...prev, { type: 'question', text: followUpQuestion }])

      // 会話IDを取得
      const { data: interviewData, error: interviewError } = await supabase
        .from('medical_interviews')
        .select('conversation_id')
        .eq('id', interview_id)
        .single()

      if (interviewError) {
        console.error('Error fetching conversation_id:', interviewError)
        throw interviewError
      }

      const conversation_id = interviewData?.conversation_id
      console.log('Using conversation_id:', conversation_id)

      let newResponse = ''
      const response = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_ANSWER_API_KEY}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: followUpQuestion,
          response_mode: 'streaming',
          conversation_id: conversation_id || '',
          user: 'user-123'
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let newConversationId = conversation_id

      // 新しい回答用の履歴項目を追加
      setChatHistory(prev => [...prev, { type: 'answer', text: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim()
            if (jsonStr !== '[DONE]') {
              try {
                const jsonData = JSON.parse(jsonStr)
                console.log('Follow-up streaming response:', jsonData)

                if (!newConversationId && jsonData.conversation_id) {
                  newConversationId = jsonData.conversation_id
                }

                if (jsonData.event === 'message' && jsonData.answer) {
                  newResponse += jsonData.answer
                  // ストリーミング中も履歴を更新
                  setChatHistory(prev => {
                    const newHistory = [...prev]
                    const lastIndex = newHistory.length - 1
                    if (lastIndex >= 0 && newHistory[lastIndex].type === 'answer') {
                      newHistory[lastIndex].text = newResponse
                    }
                    return newHistory
                  })
                }
              } catch (err) {
                console.error('JSON parse error:', err)
              }
            }
          }
        }
      }

      reader.releaseLock()

      if (newResponse) {
        // 新しい会話をDBに保存
        const { error: saveError } = await supabase
          .from('interview_conversations')
          .insert([{
            interview_id,
            question: followUpQuestion,
            answer: newResponse,
            created_at: new Date().toISOString()
          }])

        if (saveError) {
          console.error('Error saving conversation:', saveError)
          throw saveError
        }

        // conversation_idの更新が必要な場合
        if (!conversation_id && newConversationId) {
          const { error: updateError } = await supabase
            .from('medical_interviews')
            .update({
              conversation_id: newConversationId,
              last_response_at: new Date().toISOString()
            })
            .eq('id', interview_id)

          if (updateError) {
            console.error('Error updating conversation_id:', updateError)
          }
        }
      }

      setFollowUpQuestion('')
    } catch (error) {
      console.error('Error in follow-up:', error)
      setChatHistory(prev => {
        const newHistory = [...prev]
        const lastIndex = newHistory.length - 1
        if (lastIndex >= 0 && newHistory[lastIndex].type === 'answer') {
          newHistory[lastIndex].text = 'エラーが発生しました。もう一度お試しください。'
        } else {
          newHistory.push({ type: 'answer', text: 'エラーが発生しました。もう一度お試しください。' })
        }
        return newHistory
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handlePurchaseClick = async (product: RecommendedProduct) => {
    try {
      setSelectedProduct(product)
      if (!interviewId) {
        throw new Error('相談情報が見つかりません')
      }

      // 仮のUIDを生成（未ログインの場合）
      const tempUid = !user ? crypto.randomUUID() : user.id
      
      // 未ログインの場合、仮UIDをローカルストレージに保存
      if (!user) {
        localStorage.setItem('temp_uid', tempUid)
      }

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          user_id: tempUid,
          medical_interview_id: interviewId
        })
      })

      if (!response.ok) {
        throw new Error('注文の作成に失敗しました')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Purchase error:', error)
      setProductError(error instanceof Error ? error.message : '注文処理中にエラーが発生しました')
    }
  }

  const handleLogin = () => {
    try {
      // 現在のURLをローカルストレージに保存（ログイン後に戻ってこれるように）
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('returnUrl', currentPath);
      
      // ログインページへ遷移
      window.location.href = '/login';
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] via-white to-[#F8FBFA]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <nav className="text-sm text-[#4A5568] mb-2">
              <ol className="flex items-center space-x-2">
                <li><a href="/" className="hover:text-[#4C9A84]">ホーム</a></li>
                <li className="flex items-center space-x-2">
                  <span>/</span>
                  <span>健康相談結果</span>
                </li>
              </ol>
            </nav>
            <Button
              onClick={handleLogin}
              className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white px-6 py-2 rounded-xl transition-all duration-300"
            >
              ログイン
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2D3748] inline-flex items-center justify-center bg-white px-8 py-4 rounded-full shadow-sm">
            <MessageCircle className="w-7 h-7 md:w-8 md:h-8 mr-4 text-[#4C9A84]" />
            健康相談結果
          </h1>
          <p className="mt-4 text-[#4A5568] text-center mx-auto max-w-2xl">
            AIがあなたの健康状態を分析し、<br />
            最適なアドバイスをお届けします
          </p>
        </div>

        <section className="mb-12 md:mb-16">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-none rounded-2xl overflow-hidden w-full">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#E6F3EF] flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-[#4C9A84]" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-bold ml-4 text-[#2D3748]">
                    相談内容
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none text-[#4A5568] leading-relaxed">
                  <ReactMarkdown>{consultationText}</ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8 md:space-y-10">
          {chatHistory.map((message, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-none rounded-2xl overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#E6F3EF] flex items-center justify-center">
                      {message.type === 'question' ? (
                        <MessageCircle className="w-7 h-7 text-[#4C9A84]" aria-hidden="true" />
                      ) : (
                        <CheckCircle className="w-7 h-7 text-[#4C9A84]" aria-hidden="true" />
                      )}
                    </div>
                    <h2 className="text-xl font-bold ml-4 text-[#2D3748]">
                      {message.type === 'question' ? '追加の質問' : '回答'}
                    </h2>
                  </div>
                  <div className="prose prose-lg max-w-none text-[#4A5568] leading-relaxed">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-16 md:mt-20 mb-24 bg-[#F8FBFA] p-6 md:p-8 rounded-3xl">
          <h2 className="text-2xl font-bold mb-8 text-[#2D3748] flex items-center justify-center">
            <div className="bg-white px-8 py-4 rounded-full shadow-sm inline-flex items-center">
              <ShoppingBag className="w-7 h-7 mr-4 text-[#4C9A84]" aria-hidden="true" />
              おすすめ商品
            </div>
          </h2>
          
          {isLoadingProducts && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E6F3EF] border-t-[#4C9A84] mx-auto" role="status">
                <span className="sr-only">読み込み中...</span>
              </div>
              <p className="mt-6 text-[#4A5568] font-medium">商品を読み込んでいます...</p>
            </div>
          )}

          {productError && (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl mb-8 text-center font-medium" role="alert">
              {productError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {recommendedProducts.length > 0 ? (
              recommendedProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {product.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={product.image_url} 
                        alt={`${product.name}の商品画像`}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-xl mb-3 text-[#2D3748] line-clamp-2">{product.name}</h3>
                    <p className="text-[#4A5568] mb-4 line-clamp-2 text-base leading-relaxed">{product.description}</p>
                    <div className="space-y-4">
                      <p className="text-2xl font-bold text-[#2D3748]">¥{product.price.toLocaleString()}</p>
                      <Button
                        onClick={() => handlePurchaseClick(product)}
                        className="w-full bg-gradient-to-r from-[#FF9900] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF7A00] text-white px-6 py-4 rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg font-bold text-lg flex items-center justify-center space-x-2"
                        aria-label={`${product.name}を今すぐ購入`}
                      >
                        <span>今すぐ購入</span>
                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="bg-white p-8 rounded-2xl shadow-lg inline-block">
                  <ShoppingBag className="w-16 h-16 text-[#E2E8F0] mx-auto mb-4" aria-hidden="true" />
                  <p className="text-[#4A5568] font-medium">
                    おすすめ商品はありません
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-none rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 text-[#2D3748] flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-[#4C9A84]" aria-hidden="true" />
                  よくある質問
                </h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-[#4A5568] hover:text-[#4C9A84]">商品の返品について</a></li>
                  <li><a href="#" className="text-[#4A5568] hover:text-[#4C9A84]">支払い方法について</a></li>
                  <li><a href="#" className="text-[#4A5568] hover:text-[#4C9A84]">配送について</a></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-none rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 text-[#2D3748] flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-[#4C9A84]" aria-hidden="true" />
                  お問い合わせ
                </h3>
                <p className="text-[#4A5568] mb-4">
                  ご不明な点がございましたら、お気軽にお問い合わせください。
                </p>
                <Button className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white rounded-xl py-2">
                  お問い合わせフォーム
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-[#E2E8F0] p-4 md:p-6 shadow-lg backdrop-blur-lg">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleFollowUpSubmit} className="flex items-center space-x-4">
            <Input
              type="text"
              placeholder="追加で相談できます..."
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              className="flex-grow py-4 px-6 rounded-xl border-[#E2E8F0] focus:border-[#4C9A84] focus:ring-[#4C9A84] text-lg shadow-sm"
              disabled={isStreaming}
              aria-label="追加の質問を入力"
            />
            <Button 
              type="submit" 
              className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white rounded-xl p-4 min-w-[60px] h-[56px] flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isStreaming}
              aria-label={isStreaming ? "送信中..." : "質問を送信"}
            >
              {isStreaming ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" role="status">
                  <span className="sr-only">送信中...</span>
                </div>
              ) : (
                <Send className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

