'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { SiteHeader } from '@/components/site-header'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginTestPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        // 現在のセッションを取得
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        console.log('Current session:', session)
        setSession(session)

        if (session?.user) {
          // ユーザー情報を取得
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError) throw userError
          
          console.log('Current user:', user)
          setUser(user)
        }

      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session)
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#E6F3EF] to-white">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold mb-8">ログインテスト</h1>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">セッション状態</h2>
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">ユーザー情報</h2>
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">認証トークン</h2>
              <button
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession()
                  console.log('Access Token:', session?.access_token)
                  alert(`Access Token: ${session?.access_token?.slice(0, 20)}...`)
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Show Access Token
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 