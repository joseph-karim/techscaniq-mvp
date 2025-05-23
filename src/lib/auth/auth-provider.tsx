import { createContext, useContext, useEffect, useState } from 'react'
import { createClient, Session, User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null }
  }>
  signUp: (email: string, password: string, name: string, workspaceName: string) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null }
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
    data: { user: User | null }
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Get session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string, name: string, workspaceName: string) => {
    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          workspace_name: workspaceName
        }
      }
    })

    return signUpResult
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}