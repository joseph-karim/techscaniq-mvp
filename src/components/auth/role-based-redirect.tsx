import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-provider'

export const RoleBasedRedirect = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.user_metadata?.role) {
      const role = user.user_metadata.role
      
      switch (role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true })
          break
        case 'pe':
          navigate('/portfolio', { replace: true })
          break
        case 'investor':
        default:
          navigate('/dashboard', { replace: true })
          break
      }
    }
  }, [user, navigate])

  return null // This component doesn't render anything
} 