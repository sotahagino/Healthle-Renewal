import Link from 'next/link'

export function AdminFooter() {
  return (
    <footer className="bg-[#4C9A84] text-white py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-2 md:mb-0">
            <p className="text-sm">&copy; 2023 Healthle. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <Link href="/admin/terms" className="text-sm hover:underline">
              利用規約
            </Link>
            <Link href="/admin/privacy" className="text-sm hover:underline">
              プライバシーポリシー
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

