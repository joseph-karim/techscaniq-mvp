import { createContext, useContext, useEffect, useState } from 'react'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

// Auth context type
type AuthContextType = {
  user: User | null
  supabase: SupabaseClient | null
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  loading: boolean
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  supabase: null,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => ({}),
  loading: true,
})

// Helper to use auth context
export const useAuth = () => useContext(AuthContext)

// Check if Supabase environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

// Mock user for development
const mockUser = {
  id: 'mock-user-id',
  email: 'user@example.com',
  user_metadata: {
    name: 'Test User',
    role: 'investor',
  },
  app_metadata: {},
} as User

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    // Only create Supabase client if environment variables are available
    if (isSupabaseConfigured) {
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
      setSupabase(supabaseClient)

      // Check active sessions and subscribe to auth changes
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Use mock user for development when Supabase is not configured
      console.log('Using mock authentication (Supabase not configured)')
      setUser(mockUser)
      setLoading(false)
    }
  }, [])

  // Auth methods with mock implementation when Supabase is not available
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Mock sign in:', email)
      setUser(mockUser)
      return { data: { user: mockUser }, error: null }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Mock sign up:', email)
      setUser(mockUser)
      return { data: { user: mockUser }, error: null }
    }
    return supabase.auth.signUp({ email, password })
  }

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Mock sign out')
      setUser(null)
      return { error: null }
    }
    return supabase.auth.signOut()
  }

  const value = {
    user,
    supabase,
    signIn,
    signUp,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}