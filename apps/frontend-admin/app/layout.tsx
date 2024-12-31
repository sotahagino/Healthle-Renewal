import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthLayout } from './AuthLayout'
import { Header } from '@/components/layout/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Healthle 管理システム',
  description: 'Healthle管理者向けシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthLayout>
          <HeaderWrapper>{children}</HeaderWrapper>
        </AuthLayout>
      </body>
    </html>
  )
}

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'

  if (isLoginPage) {
    return children
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

