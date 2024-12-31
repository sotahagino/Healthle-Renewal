import { createContext, useContext, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  login: async () => {},
  logout: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    // 認証状態の初期化
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          auth.setUser(null)
          return
        }

        if (session?.user) {
          auth.setUser(session.user)
        } else {
          auth.setUser(null)
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error)
        auth.setUser(null)
      }
    }

    initializeAuth()
  }, [auth])

  const logout = async () => {
    try {
      // まずユーザー状態をnullに設定
      auth.setUser(null)

      // Supabaseのサインアウト処理
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // ブラウザのストレージをクリア
      window.sessionStorage.clear()
      window.localStorage.clear()

      // セッションクッキーを削除（path=/apiも含める）
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=')
        const cookieName = name.trim()
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`
      })

      // 最後にログインページにリダイレクト
      router.push('/login')

    } catch (error) {
      console.error('ログアウトエラー:', error)
      throw error
    }
  }

  const value = {
    ...auth,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { useSupabaseAuth } 