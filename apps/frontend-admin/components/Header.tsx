'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'

export function Header() {
  const router = useRouter()

  const handleLogout = () => {
    // Implement logout logic here
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
            alt="Healthle Logo"
            width={40}
            height={40}
            priority
          />
          <h1 className="ml-2 text-xl font-semibold text-[#333333]">Healthle 管理システム</h1>
        </Link>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </header>
  )
}

