import { createContext, useContext } from 'react'
import { User, Session, WeakPassword } from '@supabase/supabase-js'
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isGuestUser: boolean
  authError: Error | null
  login: (email: string, password: string) => Promise<{
    user: User
    session: Session
    weakPassword?: WeakPassword
  } | null>
  logout: () => Promise<void>
  loginAsGuest: () => Promise<{
    user: User
    session: Session
  } | null>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuestUser: false,
  authError: null,
  login: async () => null,
  logout: async () => {},
  loginAsGuest: async () => null
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

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export { useSupabaseAuth } 