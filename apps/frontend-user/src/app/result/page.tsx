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
  type: 'initial' | 'question' | 'answer'
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
  const searchParams = useSearchParams()
  const [consultationText, setConsultationText] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [response, setResponse] = useState('')
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
      const consultation_id = searchParams.get('consultation_id')
      if (!consultation_id) {
        setConsultationText('相談IDが見つかりません')
        return
      }

      try {
        // consultations、questionnaires、follow_up_conversationsを同時に取得
        const [consultationResult, questionnaireResult, followUpResult] = await Promise.all([
          supabase
            .from('consultations')
            .select('symptom_text, ai_response_text')
            .eq('id', consultation_id)
            .single(),
          supabase
            .from('questionnaires')
            .select(`
              id,
              questions (
                id,
                question_text,
                question_type,
                options,
                question_answers (
                  answer_value
                )
              )
            `)
            .eq('consultation_id', consultation_id)
            .single(),
          supabase
            .from('follow_up_conversations')
            .select('question, answer, created_at')
            .eq('consultation_id', consultation_id)
            .order('created_at', { ascending: true })
        ])

        // エラーチェックを適切に行う
        if (consultationResult.error) {
          console.error('Consultation error:', consultationResult.error)
          throw new Error('相談データの取得に失敗しました')
        }
        if (questionnaireResult.error) {
          console.error('Questionnaire error:', questionnaireResult.error)
          throw new Error('質問票データの取得に失敗しました')
        }

        const consultationData = consultationResult.data
        const questionnaireData = questionnaireResult.data
        // followUpResultはエラーの場合のみ使用（データが空の場合も正常）
        const followUpData = followUpResult.error ? [] : followUpResult.data

        if (!consultationData || !questionnaireData) {
          throw new Error('必要なデータが取得できませんでした')
        }

        // 相談内容を設定
        setConsultationText(consultationData.symptom_text)

        // 質問と回答のデータを整形
        const questions = questionnaireData.questions?.map((q: any) => {
          let answerValue = q.question_answers?.[0]?.answer_value || '未回答';
          
          // 選択肢がある場合、選択肢のテキストを取得
          if (q.options && answerValue) {
            try {
              const selectedValues = JSON.parse(answerValue);
              if (Array.isArray(selectedValues)) {
                // 複数選択の場合
                answerValue = selectedValues.map(value => {
                  const option = q.options.find((opt: any) => opt.id === value);
                  return option ? option.text : value;
                }).join('、');
              } else {
                // 単一選択の場合
                const option = q.options.find((opt: any) => opt.id === selectedValues);
                answerValue = option ? option.text : selectedValues;
              }
            } catch (e) {
              // JSON.parseに失敗した場合は元値を使用
              console.log('Answer parse error:', e);
            }
          }

          return {
            id: q.id,
            question_text: q.question_text,
            question: q.question_text,
            type: q.question_type,
            answer: answerValue
          };
        }) || [];

        setQuestions(questions);

        // チャット履歴の初期化
        const initialHistory: ChatMessage[] = []

        // 初期回答を追加
        if (consultationData.ai_response_text) {
          initialHistory.push({ type: 'initial', text: consultationData.ai_response_text })
        }

        // 追加質問と回答を追加（followUpDataが存在する場合のみ）
        if (followUpData && followUpData.length > 0) {
          followUpData.forEach((item: FollowUpData) => {
            initialHistory.push(
              { type: 'question', text: item.question },
              { type: 'answer', text: item.answer }
            )
          })
        }

        setChatHistory(initialHistory)

        // ai_response_textがnullの場合のみ、APIを呼び出す
        if (!consultationData.ai_response_text) {
          await handleStreamingAnswer(consultationData.symptom_text, questions)
        }

      } catch (error) {
        console.error('Error in fetchData:', error)
        setConsultationText(error instanceof Error ? error.message : 'データの取得に失敗しました。もう一度お試しください。')
      }
    }

    fetchData()
  }, [searchParams])

  const handleStreamingAnswer = async (symptomText: string, questions: any[]) => {
    try {
      setIsStreaming(true)
      setResponse('')
      let fullResponse = ''

      const messagePayload = {
        symptom: symptomText,
        questions: questions.map(q => ({
          question: q.question,
          answer: q.answer
        }))
      }

      console.log('Sending to API:', messagePayload);

      // 1回目回答時のリクエスト（空のconversation_id）
      const response = await fetch(`${process.env.NEXT_PUBLIC_DIFY_API_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_ANSWER_API_KEY}`,
        },
        body: JSON.stringify({
          inputs: {},
          query: JSON.stringify(messagePayload),
          response_mode: 'streaming',
          conversation_id: '', // 1回目は空文字列を使用
          user: 'user-123',
          files: []
        }),
      })

      console.log('Initial request payload:', {
        query: JSON.stringify(messagePayload),
        conversation_id: ''
      })

      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText
        })
        const errorText = await response.text()
        console.error('API Error response:', errorText)
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      // レスポンスヘッダーをログ出力
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      // conversation_id取得（ヘッダーから）
      let conversationId = response.headers.get('x-conversation-id')
      console.log('Conversation ID from header:', conversationId)

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

      const decoder = new TextDecoder()

      // ストリーミングデータの処理
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
                // レスポンスボディからもconversation_idを取得
                if (!conversationId && jsonData.conversation_id) {
                  conversationId = jsonData.conversation_id
                  console.log('Conversation ID from body:', conversationId)
                }
                if (jsonData.event === 'message' && jsonData.answer) {
                  fullResponse += jsonData.answer
                  setResponse(fullResponse)
                  // ストリーミング中も履歴を更新
                  setChatHistory([{ type: 'initial', text: fullResponse }])
                }
              } catch (err) {
                console.error("JSON parse error:", err)
              }
            }
          }
        }
      }

      reader.releaseLock()
      setIsStreaming(false)

      // 完全な応答を取得した後、DBに保存
      const consultation_id = searchParams.get('consultation_id')
      if (!consultation_id || !fullResponse) {
        throw new Error('Missing required data for save')
      }

      // APIを使用してDBに保存（session_idを含める）
      const saveResponse = await fetch('/api/consultations/save-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultation_id,
          ai_response_text: fullResponse,
          session_id: conversationId
        })
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save response')
      }

      console.log('Response saved successfully')

    } catch (error) {
      console.error("Error in handleStreamingAnswer:", error)
      setIsStreaming(false)
      setResponse('エラーが発生しました。もう一度お試しください。')
    }
  }

  // 商品提案APIを呼び出す関数
  const fetchProductRecommendations = async (query: string) => {
    try {
      const requestBody = {
        inputs: { symptom: query },  // queryをsymptomキーで渡す
        response_mode: 'blocking',
        user: 'user-123'
      };
      console.log('Product API Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.dify.ai/v1/completion-messages', {  // URLを直接指定
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DIFY_PRODUCT_API_KEY}`,  // APIキーの環境変数名も修正
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        // エラーレスポンスの詳細をログ出力
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error('商品提案APIの呼び出しに失敗しました');
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      let recommendData: DifyProductResponse;
      try {
        // 応答データから余分な文字を削除してJSONとして解析
        const answerText = data.answer.replace(/```json\n|\n```/g, '').trim();
        console.log('Cleaned answer text:', answerText);
        
        recommendData = JSON.parse(answerText);
        console.log('Parsed recommend data:', recommendData);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Raw answer:', data.answer);
        throw new Error('商品提案データの解析に失敗しました');
      }

      if (!recommendData.recommended_products?.length) {
        return [];
      }

      console.log('Querying products with IDs:', recommendData.recommended_products.map(p => p.product_id));

      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url
        `)
        .in('id', recommendData.recommended_products.map(p => p.product_id))
        .eq('status', 'on_sale');

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Retrieved products from Supabase:', products);

      if (!products || products.length === 0) {
        console.log('No products found');
        return [];
      }

      // 型変換を追加
      const formattedProducts: RecommendedProduct[] = products.map(product => {
        console.log('Processing product:', product);
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url
        };
      });

      console.log('Formatted products:', formattedProducts);
      return formattedProducts;

    } catch (error) {
      console.error('商品提案の取得に失敗:', error);
      throw error;
    }
  };

  // 既存の回答取得処理と並行して商品提案を取得
  useEffect(() => {
    const getRecommendations = async () => {
      if (!consultationText || !questions.length) return;

      setIsLoadingProducts(true);
      setProductError(null);
      
      try {
        // 相談内容と質問票の回答を取得
        const messagePayload = {
          symptom: consultationText,
          questions: questions.map(q => ({
            question: q.question_text,
            answer: q.answer
          }))
        };

        console.log('Message Payload:', messagePayload);

        // 文字列化したペイロードを渡す
        const products = await fetchProductRecommendations(JSON.stringify(messagePayload));
        console.log('Received products:', products);
        setRecommendedProducts(products || []);
      } catch (error) {
        console.error('Error in getRecommendations:', error);
        setProductError('商品提案の取得に失敗しました');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    getRecommendations();
  }, [consultationText, questions]); // 依存配列はそのまま

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followUpQuestion.trim()) return

    const consultation_id = searchParams.get('consultation_id')
    if (!consultation_id) return

    try {
      setIsStreaming(true)
      setChatHistory(prev => [...prev, { type: 'question', text: followUpQuestion }])

      // セッションIDを取得
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultations')
        .select('session_id')
        .eq('id', consultation_id)
        .single()

      if (consultationError) {
        console.error('Error fetching session_id:', consultationError)
        throw consultationError
      }

      if (!consultationData?.session_id) {
        console.error('No session_id found for consultation:', consultation_id)
        throw new Error('No session_id found')
      }

      console.log('Using saved session_id as conversation_id:', consultationData.session_id)

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
          conversation_id: consultationData.session_id,
          user: 'user-123',
          files: []
        }),
      })

      console.log('Follow-up request payload:', {
        query: followUpQuestion,
        conversation_id: consultationData.session_id
      })

      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText
        })
        const errorText = await response.text()
        console.error('API Error response:', errorText)
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      // レスポンスヘッダーをログ出力
      console.log('Follow-up response headers:', Object.fromEntries(response.headers.entries()))

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let newConversationId = null

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
                console.log('Follow-up streaming response data:', jsonData)
                // レスポンスからconversation_idを取得
                if (!newConversationId && jsonData.conversation_id) {
                  newConversationId = jsonData.conversation_id
                  console.log('New conversation ID from follow-up:', newConversationId)
                }
                if (jsonData.event === 'message' && jsonData.answer) {
                  newResponse += jsonData.answer
                  setResponse(newResponse)
                  // ストリーミング中も履歴を更新
                  setChatHistory(prev => {
                    const newHistory = [...prev]
                    // 最後の要素が回答なら更新、そうでなければ新しく追加
                    if (newHistory.length > 0 && newHistory[newHistory.length - 1].type === 'answer') {
                      newHistory[newHistory.length - 1].text = newResponse
                    } else {
                      newHistory.push({ type: 'answer', text: newResponse })
                    }
                    return newHistory
                  })
                }
              } catch (err) {
                console.error("JSON parse error:", err)
              }
            }
          }
        }
      }

      reader.releaseLock()
      
      // 新しい回答をDBに保存
      const { error: saveError } = await supabase
        .from('follow_up_conversations')
        .insert([{
          consultation_id,
          question: followUpQuestion,
          answer: newResponse,
          created_at: new Date().toISOString(),
          user_id: null // 常にnullを設定
        }]);

      if (saveError) {
        console.error('Error saving follow-up conversation:', saveError);
        throw new Error(`追加質問の保存に失敗しました: ${saveError.message}`);
      }

      setFollowUpQuestion('')
    } catch (error) {
      console.error("Error in follow-up:", error)
      setChatHistory(prev => [...prev, { type: 'answer', text: 'エラーが発生しました。もう一度お試しください。' }])
    } finally {
      setIsStreaming(false)
    }
  }

  const handlePurchaseClick = async (product: RecommendedProduct) => {
    try {
      // 購入フロー情報をlocalStorageに保存
      const purchaseFlowData = {
        product,
        timestamp: Date.now()
      }
      localStorage.setItem('purchaseFlow', JSON.stringify(purchaseFlowData))
      console.log('Saved purchaseFlow data:', purchaseFlowData)

      // 商品のペイメントリンクURLを直接取得
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stripe_payment_link_url')
        .eq('id', product.id)
        .single()

      if (productError || !productData?.stripe_payment_link_url) {
        throw new Error('決済リンクの取得に失敗しました')
      }

      // 成功時のリダイレクトURLを追加
      const successUrl = `${window.location.origin}/purchase-complete`
      const paymentUrl = new URL(productData.stripe_payment_link_url)
      paymentUrl.searchParams.set('redirect_to', successUrl)

      // ペイメントリンクに遷移
      window.location.href = paymentUrl.toString()

    } catch (error) {
      console.error('Error in handlePurchaseClick:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FBFA] via-white to-[#F8FBFA]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="text-sm text-[#4A5568] mb-2">
            <ol className="flex items-center space-x-2">
              <li><a href="/" className="hover:text-[#4C9A84]">ホーム</a></li>
              <li className="flex items-center space-x-2">
                <span>/</span>
                <span>健康相談結果</span>
              </li>
            </ol>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-2xl md:text-3xl font-bold text-[#2D3748] inline-flex items-center justify-center bg-white px-8 py-4 rounded-full shadow-sm">
            <MessageCircle className="w-7 h-7 md:w-8 md:h-8 mr-4 text-[#4C9A84]" />
            健康相談結果
          </h1>
          <p className="mt-4 text-[#4A5568] text-center mx-auto max-w-2xl">AIがあなたの健康状態を分析し、最適なアドバイスをお届けします</p>
        </div>

        <section className="mb-12 md:mb-16">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-none rounded-2xl overflow-hidden w-full">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#E6F3EF] flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-[#4C9A84]" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h2 className="text-xl font-bold mb-4 text-[#2D3748] flex items-center">
                    相談内容
                  </h2>
                  <div className="prose prose-lg max-w-none text-[#4A5568] leading-relaxed">
                    <ReactMarkdown>{consultationText}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8 md:space-y-10">
          {chatHistory.map((message, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-none rounded-2xl overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#E6F3EF] flex items-center justify-center">
                      {message.type === 'question' ? (
                        <MessageCircle className="w-7 h-7 text-[#4C9A84]" aria-hidden="true" />
                      ) : (
                        <CheckCircle className="w-7 h-7 text-[#4C9A84]" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl font-bold mb-4 text-[#2D3748] flex items-center">
                      {message.type === 'question' ? '追加の質問' : '回答'}
                    </h2>
                    <div className="prose prose-lg max-w-none text-[#4A5568] leading-relaxed">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
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
                        aria-label={`${product.name}の商品詳細を見る`}
                      >
                        <span>商品を見る</span>
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
