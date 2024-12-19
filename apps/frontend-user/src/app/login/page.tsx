"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { Footer } from '@/components/footer'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const lineLoginUrl = process.env.NEXT_PUBLIC_LINE_LOGIN_URL

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromPurchase = searchParams.get('fromPurchase')

  const handleLogin = () => {
    if (lineLoginUrl) {
      window.location.href = lineLoginUrl
    } else {
      console.error('LINE login URL is not configured')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-md mx-auto bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <Image
                src="/images/logo.png"
                alt="Healthle"
                width={80}
                height={80}
                className="mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-[#333333] mb-2">Healthleへようこそ</h1>
              <p className="text-[#666666]">LINEアカウントでログインして始めましょう</p>
            </div>
            <Button 
              onClick={handleLogin}
              className="w-full bg-[#00B900] hover:bg-[#00A000] text-white py-6 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center"
              data-cy="line-login-button"
            >
              <Image
                src="/images/line-logo.png"
                alt="LINE"
                width={24}
                height={24}
                className="mr-2"
              />
              LINEでログイン
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

