"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardFooter } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { SiteHeader } from '../../components/site-header'
import { MessageCircle, ShoppingCart, Send, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'

// Mock data
const mockProducts = [
  {
    id: 1,
    name: "睡眠サポートサプリ",
    description: "自然由来の成分で質の高い睡眠をサポート",
    price: 2980,
    image: "/placeholder.svg"
  },
  {
    id: 2,
    name: "リラックスハーブティー",
    description: "就寝前のリラックスタイムに最適",
    price: 1500,
    image: "/placeholder.svg"
  },
  {
    id: 3,
    name: "アロマディフューザー",
    description: "心地よい香りで睡眠環境を整える",
    price: 4500,
    image: "/placeholder.svg"
  }
]

const mockResponse = `ご相談ありがとうございます。症状から判断すると、ストレスや生活習慣の乱れによる不眠の可能性が考えられます。

## 睡眠の質を改善するためのアドバイス

以下の点に注意して、睡眠環境と習慣を改善してみましょう：

* **就寝時間を一定に保つ**
  - 休日も含めて、毎日同じ時間に就寝・起床するよう心がけましょう。
* **寝室の環境を整える**
  - 温度：18-22℃程度
  - 明るさ：暗くする（必要に応じてアイマスクの使用も検討）
  - 騒音：静かな環境を維持（耳栓の使用も一案）
* **寝前のリラックス習慣を作る**
  - 読書、軽いストレッチ、瞑想などがおすすめです。
* **カフェインの摂取を控える**
  - 特に午後以降は控えめにしましょう。
* **規則正しい運動習慣を身につける**
  - 毎日30分程度の軽い運動を心がけましょう。

> これらの対策を1-2週間ほど続けてみて、改善が見られない場合は、医療機関での受診をおすすめします。

睡眠に関する詳しい情報は、[国立睡眠財団のウェブサイト](https://www.sleepfoundation.org/)でご確認いただけます。`

export default function Result() {
  const router = useRouter()
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let index = 0
    const intervalId = setInterval(() => {
      if (index < mockResponse.length) {
        setResponse(mockResponse.slice(0, index + 1))
        index++
        if (responseRef.current) {
          responseRef.current.scrollTop = responseRef.current.scrollHeight
        }
      } else {
        clearInterval(intervalId)
        setIsStreaming(false)
        setTimeout(() => setIsExpanded(false), 2000) // Auto-collapse after 2 seconds
      }
    }, 50)

    return () => clearInterval(intervalId)
  }, [])

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Follow-up question:', followUpQuestion)
    setFollowUpQuestion('')
  }

  const handlePurchase = () => {
    router.push('/login?fromPurchase=true')
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
          <p className="text-sm text-[#666666]">
            最近、寝つきが悪く、夜中に何度も目が覚めてしまいます。どうすれば良いでしょうか？
          </p>
        </div>
        <Card className="bg-white shadow-lg mb-12">
          <CardContent className="p-4">
            <div className="answer-container flex items-start">
              <div className="answer-icon w-6 flex-shrink-0 mr-2 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#4C9A84]" />
              </div>
              <div className="answer-text flex-grow">
                <h2 className="text-xl font-semibold mb-4 text-[#333333]">回答</h2>
                <div
                  ref={responseRef}
                  className={`markdown-body response-container overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-[300px]'}`}
                >
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-[#4C9A84]" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-[#4C9A84]" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4" {...props} />,
                      ul: ({node, ...props}) => <ul className="mb-4 pl-0 list-none" {...props} />,
                      li: ({node, ...props}) =>
                        <li className="mb-2 relative" {...props}>
                          <span className="absolute left-0 text-[#4C9A84] text-lg" style={{transform: 'translateX(-1.5rem)'}}>•</span>
                          {props.children}
                        </li>,
                      strong: ({node, ...props}) => <strong className="font-bold text-[#1A3D3D]" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="pl-4 border-l-4 border-[#A7D7C5] italic text-[#666666] my-4" {...props} />,
                      a: ({node, ...props}) => <a className="text-[#4C9A84] hover:underline" {...props} />
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                  {isStreaming && <span className="animate-pulse">...</span>}
                </div>
                {!isStreaming && (
                  <Button
                    variant="outline"
                    className="text-[#4C9A84] w-full mt-4"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>
                        回答を折りたたむ
                        <ChevronUp className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        回答をもっと見る
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#333333] border-b-2 border-[#A7D7C5] pb-2 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-2 text-[#4C9A84]" />
            おすすめの商品
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockProducts.map((product) => (
              <Card key={product.id} className="bg-white shadow-md">
                <CardContent className="p-4">
                  <div className="bg-[#F0F8F5] rounded-md mb-4 relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-md opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[#4C9A84] font-semibold">
                      商品画像
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-[#333333]">{product.name}</h3>
                  <p className="text-sm text-[#666666] mb-3 leading-relaxed">{product.description}</p>
                  <p className="text-lg font-bold text-[#4C9A84] mb-3">¥{product.price.toLocaleString()}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    onClick={handlePurchase}
                    className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white py-3 text-lg"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    購入する
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
            <Button type="submit" className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white rounded-full p-3">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

