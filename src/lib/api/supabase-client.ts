import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Check if Supabase environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

// Create a singleton Supabase client if configured, otherwise return null
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to safely use Supabase client
export function useSupabaseClient() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase client not configured. Using mock data.')
  }
  return supabase
}

// Helper for type safety
export type TypedSupabaseClient = typeof supabase