'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  const { logout } = useAuth()

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png?t=2024-12-30T16%3A02%3A37.682Z"
            alt="Healthle"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="text-xl font-bold text-primary">Healthle Vendor</span>
        </Link>
        <Button
          variant="outline"
          onClick={logout}
          className="text-gray-600 hover:text-gray-900"
        >
          ログアウト
        </Button>
      </div>
    </header>
  )
} 