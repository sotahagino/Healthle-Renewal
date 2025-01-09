"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Provider, User as SupabaseUser } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'

interface CustomUser extends SupabaseUser {
  is_guest: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  isGuestUser: boolean;
  authError: Error | null;
  login: () => Promise<{ provider: Provider; url: string }>;
  loginAsGuest: () => Promise<{ user: any } | undefined>;
  logout: () => Promise<void>;
  migrateGuestToRegular: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<Error | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    let mounted = true
    let authSubscription: { unsubscribe: () => void } | null = null

    const initializeAuth = async () => {
      if (!mounted) return

      try {
        setLoading(true)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (!mounted) return
        
        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!mounted) return

          if (userError) {
            setUser(session.user as CustomUser)
          } else {
            setUser(userData)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setUser(null)
          setAuthError(error instanceof Error ? error : new Error('認証の初期化に失敗しました'))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    const setupAuthSubscription = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return

        try {
          setLoading(true)
          
          if (session?.user) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (!mounted) return

            if (userError) {
              setUser(session.user as CustomUser)
            } else {
              setUser(userData)
            }
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Error updating user data:', error)
          if (mounted) {
            setUser(null)
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      })

      authSubscription = subscription
    }

    initializeAuth()
    setupAuthSubscription()

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const login = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'line' as Provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/line/callback`,
        },
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const loginAsGuest = async () => {
    try {
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email: `guest_${Date.now()}@example.com`,
        password: `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      })

      if (signUpError) throw signUpError

      if (authUser) {
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authUser.id,
            is_guest: true,
          }])
          .select()
          .single()

        if (insertError) throw insertError
        setUser(userData)
        return { user: userData }
      }
    } catch (error) {
      console.error('Guest login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const migrateGuestToRegular = async () => {
    try {
      if (!user || !user.is_guest) return
      const { error } = await supabase
        .from('users')
        .update({ is_guest: false })
        .eq('id', user.id)
      
      if (error) throw error
      
      setUser(prev => prev ? { ...prev, is_guest: false } : null)
    } catch (error) {
      console.error('Error migrating guest to regular user:', error)
      setAuthError(error instanceof Error ? error : new Error('Failed to migrate user'))
    }
  }

  const value = {
    user,
    loading,
    isGuestUser: user?.is_guest ?? false,
    authError,
    login,
    loginAsGuest,
    logout,
    migrateGuestToRegular,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 