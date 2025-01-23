'use client'

import { AuthProvider } from '@/providers/auth-provider'

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
} 