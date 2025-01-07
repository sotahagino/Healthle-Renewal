"use client"

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'

export function SiteHeader() {
  const { user, isGuestUser } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center">
        <div className="flex-1">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Healthle" className="h-8" />
            <span className="text-xl font-bold text-[#4C9A84]">Healthle</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              {isGuestUser ? (
                // ゲストユーザーの場合、ログインボタンを表示
                <Link href="/login">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <LogIn className="h-4 w-4" />
                    <span>ログイン</span>
                  </Button>
                </Link>
              ) : (
                // 通常ユーザーの場合、マイページリンクを表示
                <Link href="/mypage">
                  <Button variant="outline">マイページ</Button>
                </Link>
              )}
            </>
          ) : (
            // 未ログインの場合、ログインボタンを表示
            <Link href="/login">
              <Button variant="outline" className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>ログイン</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

