import { create } from 'zustand'
import { User } from '@/types/user'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setAuthenticated: (authenticated: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  reset: () => set({ user: null, isAuthenticated: false }),
})) 