"use client"

import { useEffect, useState } from 'react'
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

export default function MedicalPage() {
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
          <Card className="bg-red-50 border-red-200 mb-6 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                緊急性の高い症状があります
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4 text-lg">
                直ちに救急車を呼ぶことをお勧めします。
              </p>
              <Button asChild size="lg" variant="destructive" className="w-full sm:w-auto">
                <Link href="tel:119" className="flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" />
                  119番通報する
                </Link>
              </Button>
            </CardContent>
          </Card>
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
          <Card className="bg-green-50 border-green-200 mb-6 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                受診をお勧めします
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 text-lg">
                体調に応じて医療機関の受診を検討してください。
              </p>
            </CardContent>
          </Card>
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 緊急度表示セクション */}
            <div className={`p-6 md:p-8 ${
              assessment.urgency_level === 'red'
                ? 'bg-red-50'
                : assessment.urgency_level === 'yellow'
                ? 'bg-yellow-50'
                : 'bg-green-50'
            }`}>
              <div className="flex flex-col items-center text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  assessment.urgency_level === 'red'
                    ? 'bg-red-100'
                    : assessment.urgency_level === 'yellow'
                    ? 'bg-yellow-100'
                    : 'bg-green-100'
                }`}>
                  {assessment.urgency_level === 'red' ? (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : assessment.urgency_level === 'yellow' ? (
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                
                <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${
                  assessment.urgency_level === 'red'
                    ? 'text-red-700'
                    : assessment.urgency_level === 'yellow'
                    ? 'text-yellow-700'
                    : 'text-green-700'
                }`}>
                  {assessment.urgency_level === 'red'
                    ? '緊急性の高い症状があります'
                    : assessment.urgency_level === 'yellow'
                    ? '早めの受診をお勧めします'
                    : '経過観察を推奨します'}
                </h1>
                
                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-2xl">
                  {assessment.urgency_level === 'red' ? (
                    <>
                      選択された症状から判断すると、緊急性が高い状態です。
                      できるだけ早く医療機関を受診することをお勧めします。
                      状況に応じて救急車の利用をご検討ください。
                    </>
                  ) : assessment.urgency_level === 'yellow' ? (
                    <>
                      選択された症状から判断すると、できるだけ早めに（本日中に）
                      医療機関を受診することをお勧めします。
                      症状が急激に悪化した場合は、すぐに救急外来を受診してください。
                    </>
                  ) : (
                    <>
                      選択された症状からは、現時点で緊急性は高くないと判断されます。
                      ただし、症状が続く場合や悪化する場合は、
                      かかりつけ医への相談や受診をご検討ください。
                    </>
                  )}
                </p>
              </div>

              {/* 緊急時の119番通報ボタン - 赤の緊急度の場合のみ表示 */}
              {assessment.urgency_level === 'red' && (
                <div className="mt-6 flex justify-center">
                  <a
                    href="tel:119"
                    className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>119番通報する</span>
                  </a>
                </div>
              )}
            </div>

            {/* 推奨診療科セクション */}
            <div className="p-6 md:p-8 border-t border-gray-100">
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

            {/* ナビゲーションボタン */}
            <div className="p-6 md:p-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  const interviewId = searchParams.get('interview_id')
                  if (interviewId && categoryId) {
                    router.push(`/urgency-assessment?interview_id=${interviewId}&category_id=${categoryId}`)
                  } else {
                    console.error('Required parameters are missing')
                    setError('必要な情報が不足しています')
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl border border-gray-200 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>症状チェックに戻る</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>ホームに戻る</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 