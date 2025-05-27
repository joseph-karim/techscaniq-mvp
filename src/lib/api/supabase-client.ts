// This file is deprecated - use src/lib/supabase.ts instead
// Re-export the main supabase client to avoid breaking existing imports
import { supabase as mainSupabaseClient } from '../supabase'

export const supabase = mainSupabaseClient

// Helper function to safely use Supabase client
export function useSupabaseClient() {
  return supabase
}

// Helper for type safety
export type TypedSupabaseClient = typeof supabase