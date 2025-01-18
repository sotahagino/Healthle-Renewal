import Link from 'next/link'
import { FileText, Shield, Building2, Newspaper } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto py-6 px-4 pb-24 sm:pb-8">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/terms" 
                className="flex items-center text-gray-600 hover:text-[#4C9A84] transition-colors duration-200"
              >
                <FileText className="w-5 h-5 mr-2.5 opacity-70" />
                <span className="text-sm">利用規約</span>
              </Link>
              <Link 
                href="/privacy" 
                className="flex items-center text-gray-600 hover:text-[#4C9A84] transition-colors duration-200"
              >
                <Shield className="w-5 h-5 mr-2.5 opacity-70" />
                <span className="text-sm">プライバシーポリシー</span>
              </Link>
            </div>
            <div className="flex flex-col space-y-4">
              <Link 
                href="/corporate" 
                className="flex items-center text-gray-600 hover:text-[#4C9A84] transition-colors duration-200"
              >
                <Building2 className="w-5 h-5 mr-2.5 opacity-70" />
                <span className="text-sm">運営会社</span>
              </Link>
              <Link 
                href="/media" 
                className="flex items-center text-gray-600 hover:text-[#4C9A84] transition-colors duration-200"
              >
                <Newspaper className="w-5 h-5 mr-2.5 opacity-70" />
                <span className="text-sm">メディア</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t">
          <p className="text-xs text-gray-400">&copy; Healthle.inc</p>
        </div>
      </div>
    </footer>
  )
}

