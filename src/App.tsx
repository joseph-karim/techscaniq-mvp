import { Suspense, useEffect, useState } from 'react'

import { AuthProvider } from '@/lib/auth/auth-provider'
import { Spinner } from '@/components/ui/spinner'
import { NotificationToast } from '@/components/ui/notification-toast'
import { useAuth } from '@/lib/auth/auth-provider'
import { AppRoutes } from '@/routes/AppRoutes'

function AppContent() {
  const { user } = useAuth()
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  } | null>(null)
  
  // Show a welcome notification when the user logs in
  useEffect(() => {
    if (user) {
      const role = user.user_metadata.role
      const timer = setTimeout(() => {
        setNotification({
          show: true,
          title: role === 'admin' ? 'Welcome, Admin' : 'Welcome Back',
          message: role === 'admin' 
            ? 'You have 3 scans awaiting review in your queue.' 
            : 'Your latest scan results are ready to view.',
          type: 'info'
        })
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [user])
  
  return (
    <>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
        <AppRoutes />
      </Suspense>

      {/* Notification toast */}
      {notification?.show && (
        <NotificationToast
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App