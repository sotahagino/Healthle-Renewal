"use client"

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { SiteHeader } from '@/components/site-header'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Provider } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'
import { LoginContent } from '../../components/login-content'

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

// 商品レコメンド用の
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

// ユーザーステータスの型定義を修正
type UserStatus = 'loading' | 'unregistered' | 'registered'

// 配送情報の型定義
interface DeliveryInfo {
  name: string
  age: string
  phone: string
  postal_code: string
  prefecture: string
  city: string
  address_line: string
  deliveryDate: string
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
  const supabase = createClientComponentClient()
  const { user, loading } = useAuth()

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

        // questionsステートを設定
        setQuestions(questions);

        // チャット履歴の初期化
        const initialHistory: ChatMessage[] = []

        // 初期回答を追加
        if (consultationData.ai_response_text) {
          initialHistory.push({ type: 'initial', text: consultationData.ai_response_text })
        }

        // 追加質問と回答を追加（followUpDataが存在する場合のみ）
        if (followUpData && followUpData.length > 0) {
          followUpData.forEach((item) => {
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
      // 質問をチャット履歴に追加
      setChatHistory(prev => [...prev, { type: 'question', text: followUpQuestion }])

      // 匿名セッションを作成
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        console.error('Auth error:', authError)
        throw new Error('認証エラーが発生しました')
      }

      // session_idを取得
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
          user_id: session?.user?.id || null // ユーザーIDを追加
        }]);

      if (saveError) {
        console.error('Error saving follow-up conversation:', saveError);
        throw new Error(`追加質問の保存に失敗しました: ${saveError.message}`);
      }

      setFollowUpQuestion('')
    } catch (error) {
      console.error("Error in follow-up:", error);
      setChatHistory(prev => [...prev, { type: 'answer', text: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setIsStreaming(false);
    }
  }

  const handlePurchaseClick = async (product: RecommendedProduct) => {
    try {
      // 商品のペイメントリンクURLを直接取得
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stripe_payment_link_url')
        .eq('id', product.id)
        .single()

      if (productError || !productData?.stripe_payment_link_url) {
        throw new Error('決済リンクの取得に失敗しました')
      }

      // 購入フロー情報をlocalStorageに保存
      localStorage.setItem('purchaseFlow', JSON.stringify({
        product,
        consultation_id: searchParams.get('consultation_id'),
        timestamp: Date.now()
      }))

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16 mb-32">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#333333]">
          あなたの健康相談結果
        </h1>

        <div className="bg-[#F0F8F5] p-4 rounded-lg mb-8">
          <h2 className="text-sm font-semibold text-[#4C9A84] mb-2 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            あなたの相談内容
          </h2>
          <p className="text-sm text-[#666666]">{consultationText}</p>
        </div>

        {chatHistory.map((message, index) => (
          <Card key={index} className="bg-white shadow-lg mb-4">
            <CardContent className="p-4">
              <div className="flex items-start">
                <div className="w-6 flex-shrink-0 mr-2 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#4C9A84]" />
                </div>
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold mb-4 text-[#333333]">
                    {message.type === 'question' ? '追加の質問' : '回答'}
                  </h2>
                  <div className="markdown-body">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {isStreaming && chatHistory.length === 0 && (
          <Card className="bg-white shadow-lg mb-4">
            <CardContent className="p-4">
              <div className="flex items-start">
                <div className="w-6 flex-shrink-0 mr-2 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#4C9A84]" />
                </div>
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold mb-4 text-[#333333]">回答</h2>
                  <div className="markdown-body">
                    <ReactMarkdown>{response}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 商品提案表示部 */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">おすすめ商品</h2>
          
          {isLoadingProducts && (
            <div className="text-center">
              <p>商品を読み込中...</p>
            </div>
          )}

          {productError && (
            <div className="text-red-500">
              {productError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedProducts.length > 0 ? (
              recommendedProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                  <div className="flex flex-col space-y-3">
                    <p className="font-bold text-lg">¥{product.price.toLocaleString()}</p>
                    <Button
                      onClick={() => handlePurchaseClick(product)}
                      className="w-full bg-[#FF9900] hover:bg-[#FF8C00] text-white px-6 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg font-bold text-lg flex items-center justify-center space-x-2"
                    >
                      <span>今すぐ購入</span>
                      <span className="text-sm">→</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                おすすめ商品はありません
              </p>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#A7D7C5] p-4 shadow-md">
        <div className="container mx-auto">
          <form onSubmit={handleFollowUpSubmit} className="flex items-center">
            <Input
              type="text"
              placeholder="追加で相談できます..."
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              className="flex-grow mr-3 py-2 px-4 rounded-full border-[#A7D7C5] focus:border-[#4C9A84] focus:ring-[#4C9A84]"
            />
            <Button 
              type="submit" 
              className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white rounded-full p-3"
              disabled={isStreaming}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
