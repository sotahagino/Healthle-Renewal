"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'

export default function MyPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user || user.is_guest) {
        console.log('Redirecting to login...')
        router.push('/login')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
        <SiteHeader />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#4C9A84]">読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user || user.is_guest) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        {/* マイページのコンテンツ */}
      </main>
      <Footer />
    </div>
  )
}

