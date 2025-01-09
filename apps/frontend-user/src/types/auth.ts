import { User as SupabaseUser } from '@supabase/supabase-js'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
export type UserType = 'guest' | 'regular' | null

export interface AuthUser extends SupabaseUser {
  id: string
  email: string
  name: string | null
  line_user_id?: string
  is_guest: boolean
  phone_number?: string | null
  created_at: string
  updated_at: string
  postal_code?: string | null
  prefecture?: string | null
  city?: string | null
  address_line?: string | null
  birthdate?: string | null
  stripe_customer_id?: string | null
}

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  userType: UserType
  error: Error | null
  isAuthenticated: boolean
  isLoading: boolean
  isGuestUser: boolean
}

export interface AuthActions {
  login: () => Promise<{ provider: string; url: string }>
  loginAsGuest: () => Promise<void>
  logout: () => Promise<void>
  migrateGuestToRegular: () => Promise<void>
  refreshSession: () => Promise<void>
}

export type AuthContextType = AuthState & AuthActions

export interface StoredSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  user: SupabaseUser
} 