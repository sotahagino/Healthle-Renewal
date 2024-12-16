"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const questions = [
  {
    id: 1,
    text: "症状はいつ頃から始まりましたか？",
    options: ["1週間以内", "1ヶ月以内", "3ヶ月以内", "半年以上前から"]
  },
  {
    id: 2,
    text: "症状の頻度はどのくらいですか？",
    options: ["毎日", "週に数回", "月に数回", "たまに"]
  },
  {
    id: 3,
    text: "症状は日常生活にどの程度影響していますか？",
    options: ["全く影響なし", "少し影響あり", "かなり影響あり", "日常生活が困難"]
  },
  {
    id: 4,
    text: "これまでに似たような症状で医療機関を受診したことはありますか？",
    options: ["はい", "いいえ"]
  },
  {
    id: 5,
    text: "現在、定期的に服用している薬はありますか？",
    options: ["はい", "いいえ"]
  }
]

export default function Questionnaire() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''))

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    // Here you would typically send the answers to your backend
    console.log(answers)
    // For now, we'll just log the answers
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#333333]">
          健康状態についての質問
        </h1>
        <Card className="max-w-2xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-[#666666] mb-2">
                <span>質問 {currentQuestion + 1} / {questions.length}</span>
                <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% 完了</span>
              </div>
              <div className="w-full bg-[#E6F3EF] rounded-full h-2">
                <div
                  className="bg-[#4C9A84] h-2 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-4 text-[#333333]">
              {questions[currentQuestion].text}
            </h2>
            <RadioGroup
              value={answers[currentQuestion]}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {currentQuestion === questions.length - 1 && (
              <Textarea
                placeholder="その他、気になる症状や伝えたいことがあればご記入ください。"
                className="mt-4 w-full"
              />
            )}
            <div className="flex justify-between mt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> 前へ
              </Button>
              {currentQuestion < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion]}
                  className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white flex items-center"
                >
                  次へ <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!answers[currentQuestion]}
                  className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
                >
                  回答を送信
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

