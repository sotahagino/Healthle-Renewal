"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Menu, LogIn } from 'lucide-react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

export function SiteHeader() {
  const router = useRouter()

  const handleMenuClick = () => {
    router.push('/mypage')
  }

  return (
    <header className="w-full bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
            alt="Healthle"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="text-2xl font-bold text-[#4C9A84]">Healthle</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" size="sm" className="text-[#4C9A84] border-[#4C9A84]">
              <LogIn className="mr-2 h-4 w-4" />
              ログイン
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#4C9A84]"
            onClick={handleMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  )
}

