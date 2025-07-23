import { createClient } from '@supabase/supabase-js'
import { Digest } from '@/types/digest'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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