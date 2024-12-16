import Link from 'next/link'
import { FileText, Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto py-8 px-4">
      <div className="container mx-auto text-center text-sm text-[#666666] space-y-4">
        <div className="flex justify-center space-x-6">
          <Link href="/terms" className="flex items-center hover:underline">
            <FileText className="w-4 h-4 mr-2" />
            利用規約
          </Link>
          <Link href="/privacy" className="flex items-center hover:underline">
            <Shield className="w-4 h-4 mr-2" />
            プライバシーポリシー
          </Link>
        </div>
        <p>&copy; 2023 Healthle. All rights reserved.</p>
      </div>
    </footer>
  )
}

