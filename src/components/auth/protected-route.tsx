import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-provider'
import { Spinner } from '@/components/ui/spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If route requires admin role, check the user's role
  if (requireAdmin) {
    const userProfile = user.user_metadata
    if (userProfile?.role !== 'admin') {
      // Redirect to dashboard if user is not an admin
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}