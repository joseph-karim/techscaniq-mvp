import { useAuth } from '@/lib/auth/auth-provider'
import { Navigate, Outlet } from 'react-router-dom'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  // Show loading indicator while checking authentication
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If roles are specified, check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.user_metadata?.role || 'investor'
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // If user is authenticated and has required role, render the protected content
  return <Outlet />
}