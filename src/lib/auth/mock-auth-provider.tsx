import { createContext, useContext, useState } from 'react'

// Define a mock user type that matches what we'd expect from Supabase
export interface MockUser {
  id: string
  email: string
  user_metadata: {
    name?: string
    role: 'investor' | 'admin'
    workspace_name?: string
  }
}

type MockSession = {
  user: MockUser
}

type AuthContextType = {
  user: MockUser | null
  session: MockSession | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    data: { user: MockUser | null; session: MockSession | null }
  }>
  signUp: (email: string, password: string, name: string, workspaceName: string) => Promise<{
    error: Error | null
    data: { user: MockUser | null; session: MockSession | null }
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
    data: { user: MockUser | null }
  }>
  switchRole: (role: 'investor' | 'admin') => void
}

// Create a mock investor user
const mockInvestorUser: MockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'investor@example.com',
  user_metadata: {
    name: 'John Investor',
    role: 'investor',
    workspace_name: 'Acme Capital',
  }
}

// Create a mock admin user
const mockAdminUser: MockUser = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'admin@example.com',
  user_metadata: {
    name: 'Admin User',
    role: 'admin',
    workspace_name: 'TechScan IQ',
  }
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // In development, we'll auto-login as the investor
  const [user, setUser] = useState<MockUser | null>(mockInvestorUser)
  const [session, setSession] = useState<MockSession | null>(user ? { user } : null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Function to switch between roles (investor and admin)
  const switchRole = (role: 'investor' | 'admin') => {
    const newUser = role === 'admin' ? mockAdminUser : mockInvestorUser
    setUser(newUser)
    setSession({ user: newUser })
  }

  // Mock sign in that accepts any credentials in dev mode
  const signIn = async (email: string, _password: string) => {
    setIsLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 500)) // Fake delay
    
    try {
      let mockUser = null

      // Simple logic to determine which mock user to use
      if (email.includes('admin')) {
        mockUser = mockAdminUser
      } else {
        mockUser = mockInvestorUser
      }

      setUser(mockUser)
      const mockSession = { user: mockUser }
      setSession(mockSession)
      
      return {
        error: null,
        data: { user: mockUser, session: mockSession }
      }
    } catch (error) {
      return {
        error: error as Error,
        data: { user: null, session: null }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, _password: string, name: string, workspaceName: string) => {
    setIsLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 800)) // Fake delay
    
    try {
      // Create a new mock user with the provided details
      const newUser: MockUser = {
        id: `user-${Date.now()}`,
        email,
        user_metadata: {
          name,
          role: 'investor',
          workspace_name: workspaceName
        }
      }
      
      // In a real implementation, we would store the user in the database
      // For now, we'll just pretend the registration was successful
      
      return {
        error: null,
        data: { 
          user: newUser, 
          session: { user: newUser } 
        }
      }
    } catch (error) {
      return {
        error: error as Error,
        data: { user: null, session: null }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    await new Promise(resolve => setTimeout(resolve, 300)) // Fake delay
    setUser(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 500)) // Fake delay
    
    return {
      error: null,
      data: { user: null }
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    switchRole
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