"use client"

import Link from "next/link"
import { useAuth } from '@/providers/auth-provider'
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <img
            src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
            alt="Healthle"
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-[#4C9A84]">Healthle</span>
        </Link>

        <div>
          {user ? (
            <Link href="/mypage">
              <Button variant="outline" className="text-[#4C9A84] border-[#4C9A84] hover:bg-[#4C9A84] hover:text-white">
                マイページ
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="text-[#4C9A84] border-[#4C9A84] hover:bg-[#4C9A84] hover:text-white">
                ログイン
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

