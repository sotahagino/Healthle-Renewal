'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const { logout } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Healthle Vendor</h1>
        <Button
          variant="ghost"
          onClick={logout}
        >
          ログアウト
        </Button>
      </div>
    </header>
  )
} 