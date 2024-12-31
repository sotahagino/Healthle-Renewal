'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログに記録する
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
        <p className="text-gray-600 mb-4">
          申し訳ありませんが、予期せぬエラーが発生しました。しばらく経ってからもう一度お試しください。
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            エラーコード: {error.digest}
          </p>
        )}
        <div className="flex flex-col space-y-2">
          <Button onClick={() => reset()} className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
            再試行
          </Button>
          <Link href="/" passHref>
            <Button variant="outline">ホームへ戻る</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

