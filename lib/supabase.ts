import { createClient } from '@supabase/supabase-js'
import { Digest } from '@/types/digest'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      digests: {
        Row: Digest
        Insert: Omit<Digest, 'id' | 'created_at'>
        Update: Partial<Omit<Digest, 'id' | 'created_at'>>
      }
    }
  }
}