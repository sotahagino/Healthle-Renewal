'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: any
  loading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  login: () => Promise<any>
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, login, logout, isGuest, authError, refreshUserData } = useAuth()

  useEffect(() => {
    if (authError) {
      console.error('Auth error:', authError)
      router.push('/login')
    }
  }, [authError, router])

  // ページ遷移時にユーザーデータを更新
  useEffect(() => {
    const updateUserData = async () => {
      if (user && !loading) {
        console.log('Updating user data after navigation')
        await refreshUserData()
      }
    }
    updateUserData()
  }, [pathname, user?.id])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isGuest,
    login,
    logout,
    refreshUserData,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
} 