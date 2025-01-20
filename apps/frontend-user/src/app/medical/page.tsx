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

interface UrgencyAssessment {
  urgency_level: 'red' | 'yellow' | 'green'
  recommended_departments: string[]
}

export default function MedicalPage() {
  const searchParams = useSearchParams()
  const [assessment, setAssessment] = useState<UrgencyAssessment | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          .select('urgency_level, recommended_departments')
          .eq('interview_id', interviewId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        setAssessment(data)
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
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="mb-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                ホームに戻る
              </Link>
            </Button>
          </div>

          {renderUrgencyMessage()}

          {assessment?.recommended_departments && assessment.recommended_departments.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-800">推奨される診療科</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2">
                  {assessment.recommended_departments.map((dept, index) => (
                    <li 
                      key={index} 
                      className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      {dept}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
} 