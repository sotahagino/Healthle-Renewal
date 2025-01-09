import { User as SupabaseUser } from '@supabase/supabase-js'

export interface CustomUser extends SupabaseUser {
  name?: string
  phone_number?: string
  is_guest?: boolean
}

export type { CustomUser as User } 