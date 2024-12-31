'use client'

import { Inter } from "next/font/google"
import "./globals.css"
import { AuthContext, useSupabaseAuth } from '@/contexts/AuthContext'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const auth = useSupabaseAuth()

  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthContext.Provider value={auth}>
          {children}
        </AuthContext.Provider>
      </body>
    </html>
  )
} 