import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <FileQuestion className="mx-auto h-12 w-12 text-[#4C9A84] mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ページが見つかりません</h1>
        <p className="text-gray-600 mb-4">
          申し訳ありませんが、お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex flex-col space-y-2">
          <Link href="/" passHref>
            <Button className="bg-[#4C9A84] hover:bg-[#3A8B73] text-white">
              ホームへ戻る
            </Button>
          </Link>
          <Link href="/login" passHref>
            <Button variant="outline">ログイン画面へ</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

