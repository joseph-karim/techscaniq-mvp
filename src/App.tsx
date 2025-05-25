import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'

import { AuthProvider } from '@/lib/auth/mock-auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Spinner } from '@/components/ui/spinner'
import { NotificationToast } from '@/components/ui/notification-toast'
import { useAuth } from '@/lib/auth/mock-auth-provider'
const PEReportPage = lazy(() => import('@/pages/pe/enhanced-report'))
const DeepDivePEReportPage = lazy(() => import('@/pages/pe/deep-dive-report'))

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const RequestScanPage = lazy(() => import('@/pages/scans/request-scan'))
const ScanDetailsPage = lazy(() => import('@/pages/scans/scan-details'))
const ReportPage = lazy(() => import('@/pages/reports/report'))
const AdvisorReviewPage = lazy(() => import('@/pages/advisor/review'))
const AdvisorQueuePage = lazy(() => import('@/pages/advisor/queue'))
const PortfolioPage = lazy(() => import('@/pages/pe/portfolio'))
const ThesisTrackingPage = lazy(() => import('@/pages/pe/thesis-tracking'))

const SettingsPage = lazy(() => import('@/pages/settings'))

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
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scans/request" element={<RequestScanPage />} />
            <Route path="/scans/:id" element={<ScanDetailsPage />} />
            <Route path="/reports/:id" element={<ReportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          
          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin><DashboardLayout /></ProtectedRoute>}>
            <Route path="/advisor/review/:id" element={<AdvisorReviewPage />} />
            <Route path="/advisor/queue" element={<AdvisorQueuePage />} />
          </Route>
          
          {/* PE routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/pe/portfolio" element={<PortfolioPage />} />
            <Route path="/pe/thesis-tracking" element={<ThesisTrackingPage />} />
            <Route path="/pe/reports/:id" element={<PEReportPage />} />
            <Route path="/pe/deep-dive-reports/:id" element={<DeepDivePEReportPage />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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