'use client'

import { useEffect } from 'react'
import { Inter } from "next/font/google"
import "./globals.css"
import { getSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Client session check:', { session, error })
    }

    checkSession()
  }, [])

  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
