import { createContext, useContext, useEffect, useState } from 'react'
import { type SupabaseClient, type User } from '@supabase/supabase-js'
import { supabase as mainSupabaseClient } from '@/lib/supabase'

// Auth context type
type AuthContextType = {
  user: User | null
  role: string | null
  supabase: SupabaseClient | null
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name?: string, workspaceName?: string, role?: string) => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
  loading: boolean
  isLoading: boolean
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  supabase: null,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => ({}),
  resetPassword: async () => ({}),
  loading: true,
  isLoading: true,
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
} as unknown as User

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    // Only create Supabase client if environment variables are available
    if (isSupabaseConfigured) {
      setSupabase(mainSupabaseClient)

      // Check active sessions and subscribe to auth changes
      mainSupabaseClient.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      const { data: { subscription } } = mainSupabaseClient.auth.onAuthStateChange(
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
      
      // Determine role based on email for demo purposes
      let role = 'investor'
      let name = 'Demo User'
      let workspaceName = 'Demo Workspace'
      
      if (email.includes('admin')) {
        role = 'admin'
        name = 'Admin User'
        workspaceName = 'TechScan IQ Admin'
      } else if (email.includes('pe')) {
        role = 'pe'
        name = 'PE Partner'
        workspaceName = 'Private Equity Firm'
      } else if (email.includes('investor')) {
        role = 'investor'
        name = 'Investor'
        workspaceName = 'Venture Capital'
      }
      
      const mockUserWithRole = {
        ...mockUser,
        email,
        user_metadata: {
          name,
          role,
          workspace_name: workspaceName,
        },
      }
      
      setUser(mockUserWithRole)
      return { data: { user: mockUserWithRole }, error: null }
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string, name?: string, workspaceName?: string, role?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Mock sign up:', email, { name, workspaceName, role })
      const mockUserWithMetadata = {
        ...mockUser,
        email,
        user_metadata: {
          name: name || 'Test User',
          role: role || 'investor',
          workspace_name: workspaceName || 'Test Workspace',
        },
      }
      setUser(mockUserWithMetadata)
      return { data: { user: mockUserWithMetadata }, error: null }
    }
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name,
          workspace_name: workspaceName,
          role: role || 'investor',
        }
      }
    })
  }

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Mock sign out')
      setUser(null)
      return { error: null }
    }
    return supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Mock reset password:', email)
      return { data: null, error: null }
    }
    return supabase.auth.resetPasswordForEmail(email)
  }

  const value = {
    user,
    role: user?.user_metadata?.role || null,
    supabase,
    signIn,
    signUp,
    signOut,
    resetPassword,
    loading,
    isLoading: loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}