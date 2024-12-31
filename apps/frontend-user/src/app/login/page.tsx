"use client"

import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { LoginContent } from '@/components/login-content'

const lineLoginUrl = process.env.NEXT_PUBLIC_LINE_LOGIN_URL

export default function Login() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user) {
      router.push('/mypage')
    }
  }, [user, router])

  const handleLogin = () => {
    if (lineLoginUrl) {
      window.location.href = lineLoginUrl
    } else {
      console.error('LINE login URL is not configured')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-md mx-auto bg-white shadow-lg">
          <CardContent className="p-8">
            <LoginContent onLogin={handleLogin} />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

