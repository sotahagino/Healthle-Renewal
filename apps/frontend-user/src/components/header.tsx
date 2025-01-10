'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
                alt="Healthle"
                width={32}
                height={32}
                className="rounded-sm"
              />
              <span className="font-bold text-xl text-[#4C9A84]">Healthle</span>
            </Link>
          </div>
          <nav className="flex items-center">
            {user ? (
              <Button
                variant="ghost"
                className="text-[#4C9A84] hover:bg-[#4C9A84]/10"
                asChild
              >
                <Link href="/mypage">
                  マイページ
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-[#4C9A84] hover:bg-[#4C9A84]/10"
                asChild
              >
                <Link href="/login">
                  ログイン
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
} 