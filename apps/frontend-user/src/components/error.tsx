'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter } from "./ui/card"
import { SiteHeader } from './site-header'
import { Footer } from './footer'
import { ErrorMessage } from './error-message'
import { Home, RefreshCcw } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-2xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-center mb-6 text-[#333333]">エラーが発生しました</h1>
            <ErrorMessage 
              title="申し訳ありません"
              description="予期せぬエラーが発生しました。しばらく経ってからもう一度お試しください。"
            />
            <p className="text-center text-[#666666]">
              エラーコード: {error.digest}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4 p-6 bg-[#F0F8F5]">
            <Button onClick={reset} variant="outline" className="flex items-center">
              <RefreshCcw className="mr-2 h-4 w-4" />
              再試行
            </Button>
            <Link href="/" passHref>
              <Button className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white flex items-center">
                <Home className="mr-2 h-4 w-4" />
                トップへ戻る
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

