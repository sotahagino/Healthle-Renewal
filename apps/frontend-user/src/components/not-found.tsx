import Link from 'next/link'
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter } from "./ui/card"
import { SiteHeader } from './site-header'
import { Footer } from './footer'
import { ErrorMessage } from './error-message'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <Card className="max-w-2xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-center mb-6 text-[#333333]">ページが見つかりません</h1>
            <ErrorMessage 
              title="404 Not Found"
              description="お探しのページは存在しないか、移動または削除された可能性があります。"
            />
          </CardContent>
          <CardFooter className="flex justify-center p-6 bg-[#F0F8F5]">
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

