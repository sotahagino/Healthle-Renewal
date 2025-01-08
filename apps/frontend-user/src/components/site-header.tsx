"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogIn, User } from 'lucide-react'

export function SiteHeader() {
  const { user, isGuestUser } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center space-x-2 transition-transform hover:scale-105">
            <Image
              src="https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
              alt="Healthle"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-[#4C9A84] to-[#65B7A0] bg-clip-text text-transparent">
              Healthle
            </span>
          </Link>

          <nav className="flex items-center space-x-3">
            {user ? (
              <>
                {isGuestUser ? (
                  <div className="flex items-center space-x-3">
                    <Link href="/login" prefetch={false}>
                      <Button 
                        variant="outline" 
                        className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-[#4C9A84] text-[#4C9A84] hover:text-[#3A8B73] transition-colors"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>ログイン</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link href="/mypage" prefetch={false}>
                      <Button 
                        variant="outline" 
                        className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-[#4C9A84] text-[#4C9A84] hover:text-[#3A8B73] transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>マイページ</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <Link href="/login" prefetch={false}>
                <Button 
                  variant="outline" 
                  className="flex items-center space-x-2 bg-white hover:bg-gray-50 border-[#4C9A84] text-[#4C9A84] hover:text-[#3A8B73] transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>ログイン</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

