"use client"

import { useEffect, useState, Suspense } from 'react'
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Phone, Home } from 'lucide-react'
import Link from 'next/link'
import { getSupabaseClient } from "@/lib/supabase"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
// @ts-ignore - Next.js 14.1.0の型定義の問題を回避
import { useRouter } from 'next/navigation'
interface UrgencyAssessment {
  urgency_level: 'red' | 'yellow' | 'green'
  recommended_departments: string[]
}

function MedicalContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [assessment, setAssessment] = useState<UrgencyAssessment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const interviewId = searchParams.get('interview_id')
        const urgencyLevel = searchParams.get('urgency_level')
        
        if (!interviewId || !urgencyLevel) {
          setError('必要な情報が不足しています')
          return
        }

        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('urgency_assessments')
          .select('urgency_level, recommended_departments, category_id')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        setAssessment(data)
        setCategoryId(data.category_id)
      } catch (err) {
        console.error('Error fetching assessment:', err)
        setError('評価結果の読み込みに失敗しました')
      }
    }

    fetchAssessment()
  }, [searchParams])

  const renderUrgencyMessage = () => {
    if (!assessment) return null

    switch (assessment.urgency_level) {
      case 'red':
        return (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 緊急度表示セクション */}
            <div className="p-6 md:p-8 bg-red-50">
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-red-100">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold mb-3 text-red-700">
                  緊急性の高い症状があります
                </h1>
                
                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl mb-8">
                  選択された症状から判断すると、緊急性が非常に高い状態です。
                  直ちに救急車を呼び、救急医療機関を受診することを強くお勧めします。
                </p>

                {/* 119番通報ボタン */}
                <a
                  href="tel:119"
                  className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto mb-4"
                >
                  <Phone className="w-6 h-6" />
                  <span className="text-lg">119番通報する</span>
                </a>

                <p className="text-sm text-red-600 mt-4">
                  ※救急車が到着するまでの間、呼吸や意識状態に注意を払い、
                  状態が急変した場合は再度119番通報してください。
                </p>
              </div>
            </div>

            {/* 注意事項セクション */}
            <div className="p-6 md:p-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">救急車を呼ぶ際の注意事項</h2>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-700">
                    1. 落ち着いて、ゆっくりと正確に状況を説明してください。
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-700">
                    2. 現在地の住所や目標となる建物を確認してください。
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-700">
                    3. 可能であれば、救急車の到着を待つ間、玄関や部屋の明かりをつけてください。
                  </p>
                </div>
              </div>
            </div>

            {/* ホームに戻るボタン */}
            <div className="p-6 md:p-8 border-t border-gray-100">
              <button
                onClick={() => router.push('/')}
                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl border border-gray-200 transition-all duration-300"
              >
                <Home className="w-5 h-5" />
                <span>ホームに戻る</span>
              </button>
            </div>
          </div>
        )
      case 'yellow':
        return (
          <Card className="bg-yellow-50 border-yellow-200 mb-6 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-700 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                早めの受診をお勧めします
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 text-lg">
                できるだけ早く（本日中に）医療機関を受診することをお勧めします。
              </p>
            </CardContent>
          </Card>
        )
      case 'green':
        return (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8 bg-green-50">
              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-100">
                  <AlertCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold mb-3 text-green-700">
                  受診をお勧めします
                </h1>
                
                <p className="text-green-700 text-sm md:text-base leading-relaxed max-w-2xl">
                  体調に応じて医療機関の受診を検討してください。
                </p>
              </div>
            </div>
          </div>
        )
    }
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="container px-4 py-8 max-w-2xl">
            <Card className="border-red-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="h-6 w-6 flex-shrink-0" />
                  <p className="text-lg">{error}</p>
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => router.push('/')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Home className="h-4 w-4" />
                    <span>ホームに戻る</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!assessment) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-32 w-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="mb-8">
            {renderUrgencyMessage()}
          </div>
          
          {/* 推奨診療科セクション - 緊急時（赤）以外の場合のみ表示 */}
          {assessment && assessment.urgency_level !== 'red' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">推奨される診療科</h2>
                  <div className="space-y-3">
                    {assessment.recommended_departments.map((department, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-gray-200">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">{department}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ホームに戻るボタン */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 md:p-8">
                  <button
                    onClick={() => router.push('/')}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl border border-gray-200 transition-all duration-300"
                  >
                    <Home className="w-5 h-5" />
                    <span>ホームに戻る</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function MedicalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MedicalContent />
    </Suspense>
  )
} 