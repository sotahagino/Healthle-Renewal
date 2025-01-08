import { createContext, useContext } from 'react'
import { User, Session, WeakPassword, Provider } from '@supabase/supabase-js'
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth'

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<{ provider: Provider; url: string }>;
  loginAsGuest: () => Promise<{ user: any } | undefined>;
  logout: () => Promise<void>;
  isGuest: boolean;
  isGuestUser: boolean;
  authError: Error | null;
  migrateGuestToRegular: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ provider: 'line' as Provider, url: '' }),
  loginAsGuest: async () => undefined,
  logout: async () => {},
  isGuest: false,
  isGuestUser: false,
  authError: null,
  migrateGuestToRegular: async () => {},
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