"use client"

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'

interface LegalDocument {
  id: string
  title: string
  content: string
  version: string
  updated_at: string
}

export default function PrivacyPage() {
  const [privacy, setPrivacy] = useState<LegalDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const response = await fetch('/api/legal-documents?type=privacy')
        if (!response.ok) {
          throw new Error('プライバシーポリシーの取得に失敗しました')
        }
        const data = await response.json()
        setPrivacy(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchPrivacy()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-8">{privacy?.title || 'プライバシーポリシー'}</h1>
        
        <div className="prose prose-sm max-w-none">
          {privacy?.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>バージョン: {privacy?.version}</p>
          <p>最終更新日: {privacy?.updated_at ? new Date(privacy.updated_at).toLocaleDateString('ja-JP') : ''}</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

