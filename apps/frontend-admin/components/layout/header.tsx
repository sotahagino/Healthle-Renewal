'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'
import supabase from '@/lib/supabase'

export function Header() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('admin_access_token')
    router.push('/login')
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-4">
          <Image
            src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
            alt="Healthle Logo"
            width={40}
            height={40}
            priority
          />
          <span className="font-semibold text-lg">Healthle 管理システム</span>
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-gray-600 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </Button>
      </div>
    </header>
  )
} 