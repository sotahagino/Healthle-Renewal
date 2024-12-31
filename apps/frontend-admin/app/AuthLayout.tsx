"use client"

import { useAuth } from '@/hooks/useAuth'

export function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  // ローディング中はローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // 認証チェックはuseAuth内で行われ、未認証の場合は自動的に/loginにリダイレクトされます
  return <>{children}</>
} 