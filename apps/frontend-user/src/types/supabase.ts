export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          is_guest: boolean
          created_at: string
          updated_at?: string
        }
        Insert: {
          id: string
          email: string
          is_guest?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_guest?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          user_id: string
          symptom_text: string
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          symptom_text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symptom_text?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 