"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Consultation {
  id: string
  symptom_text: string
  created_at: string
  ai_response_text: string
}

export default function ConsultationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    const fetchConsultations = async () => {
      try {
        const { data, error } = await supabase
          .from('consultations')
          .select('id, symptom_text, created_at, ai_response_text')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching consultations:', error)
          return
        }

        setConsultations(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchConsultations()
    }
  }, [user, authLoading, router])

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 相談内容を要約する関数（最初の50文字を表示）
  const summarizeText = (text: string) => {
    if (text.length <= 50) return text
    return text.substring(0, 50) + '...'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9A84]" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
            <h1 className="text-2xl font-bold">相談履歴</h1>
          </div>

          {consultations.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-center text-gray-500">相談履歴がありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <Card key={consultation.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-2">
                          <MessageCircle className="h-5 w-5 text-[#4C9A84] mr-2" />
                          <h3 className="text-lg font-semibold">{summarizeText(consultation.symptom_text)}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          {formatDate(consultation.created_at)}
                        </p>
                        <p className="text-sm text-gray-700">
                          {summarizeText(consultation.ai_response_text || '回答を生成中...')}
                        </p>
                      </div>
                      <Button
                        onClick={() => router.push(`/result?consultation_id=${consultation.id}`)}
                        className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white"
                      >
                        詳細を見る
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
} 