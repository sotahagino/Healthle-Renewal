'use client'

import Link from "next/link"
import { useAuth } from '@/providers/auth-provider'
import { Button } from "@/components/ui/button"

export function AuthButtons() {
  const { user } = useAuth()

  return (
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
  )
} 