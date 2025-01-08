'use client'

import { useEffect } from 'react'
import { supabase } from '@/utils/supabase'
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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Client session check:', { session, error })

      // セッション変更のリスナーを設定
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.id)
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    checkSession()
  }, [])

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
