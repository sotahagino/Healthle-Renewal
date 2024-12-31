import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        // 現在のセッションを取得
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          if (session?.user) {
            console.log('Initial session:', session)
            setUser(session.user)
          } else {
            setUser(null)
          }
          setLoading(false)
        }

      } catch (error) {
        console.error('Error in initializeAuth:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session })
      
      if (mounted) {
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
          // 認証が必要なページにいる場合はログインページにリダイレクト
          const protectedPaths = ['/mypage', '/consultations', '/result']
          const currentPath = window.location.pathname
          if (protectedPaths.some(path => currentPath.startsWith(path))) {
            router.push('/login')
          }
        }
        setLoading(false)
      }
    })

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // ブラウザのストレージをクリア
      window.sessionStorage.clear()
      window.localStorage.clear()

      // セッションクッキーを削除
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=')
        const cookieName = name.trim()
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`
      })

      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    setUser,
    login: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setUser(data.user)
      } catch (error) {
        console.error('Login error:', error)
        throw error
      }
    },
    logout
  }
} 