'use client'

import { useEffect } from 'react'
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter } from "./ui/card"
import { ErrorMessage } from './error-message'
import { RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#E6F3EF] to-white p-4">
          <Card className="max-w-2xl w-full bg-white shadow-lg">
            <CardContent className="p-6 space-y-6">
              <h1 className="text-3xl font-bold text-center mb-6 text-[#333333]">重大なエラーが発生しました</h1>
              <ErrorMessage 
                title="申し訳ありません"
                description="システムに問題が発生しました。管理者に連絡してください。"
              />
              <p className="text-center text-[#666666]">
                エラーコード: {error.digest}
              </p>
            </CardContent>
            <CardFooter className="flex justify-center p-6 bg-[#F0F8F5]">
              <Button onClick={reset} className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white flex items-center">
                <RefreshCcw className="mr-2 h-4 w-4" />
                再読み込み
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  )
}

