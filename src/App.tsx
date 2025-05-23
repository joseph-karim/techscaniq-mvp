import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'

import { AuthProvider } from '@/lib/auth/mock-auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Spinner } from '@/components/ui/spinner'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const RequestScanPage = lazy(() => import('@/pages/scans/request-scan'))
const ScanDetailsPage = lazy(() => import('@/pages/scans/scan-details'))
const ReportPage = lazy(() => import('@/pages/reports/report'))
const AdvisorReviewPage = lazy(() => import('@/pages/advisor/review'))
const SettingsPage = lazy(() => import('@/pages/settings'))

function App() {
  return (
    <AuthProvider>
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
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App