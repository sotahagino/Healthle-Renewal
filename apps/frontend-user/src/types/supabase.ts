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
      medical_interviews: {
        Row: {
          id: string
          user_id: string | null
          symptom_text: string | null
          questions: any | null
          answers: any | null
          ai_response_text: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          symptom_text?: string | null
          questions?: any | null
          answers?: any | null
          ai_response_text?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          symptom_text?: string | null
          questions?: any | null
          answers?: any | null
          ai_response_text?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
} 