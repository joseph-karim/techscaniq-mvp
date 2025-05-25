import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const RequestScanPage = lazy(() => import('@/pages/scans/request-scan'))
const ScanDetailsPage = lazy(() => import('@/pages/scans/scan-details'))
const ScanReportPaginated = lazy(() => import('@/pages/reports/scan-report-paginated'))
const AdvisorReviewPage = lazy(() => import('@/pages/advisor/review'))
const AdvisorQueuePage = lazy(() => import('@/pages/advisor/queue'))
const PortfolioPage = lazy(() => import('@/pages/pe/portfolio'))
const ThesisTrackingPage = lazy(() => import('@/pages/pe/thesis-tracking'))
const DeepDivePEReportPaginated = lazy(() => import('@/pages/pe/deep-dive-report-paginated'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const AnalyticsPage = lazy(() => import('@/pages/analytics'))
const ReportsListPage = lazy(() => import('@/pages/reports/reports-list'))

// Route configuration interface
export interface RouteConfig {
  path: string
  element?: React.ReactNode
  children?: RouteConfig[]
  requireAuth?: boolean
  requireAdmin?: boolean
  requirePE?: boolean
  label?: string
  icon?: React.ComponentType
  showInNav?: boolean
}

// Centralized route configuration
export const routeConfig: RouteConfig[] = [
  // Auth routes (public)
  {
    path: '/login',
    element: <LoginPage />,
    label: 'Login',
    showInNav: false
  },
  {
    path: '/register',
    element: <RegisterPage />,
    label: 'Register',
    showInNav: false
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    label: 'Forgot Password',
    showInNav: false
  },
  
  // Protected routes - Available to all authenticated users
  {
    path: '/',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    requireAuth: true,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
        showInNav: false
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        label: 'Dashboard',
        showInNav: true
      },
      {
        path: 'scans/request',
        element: <RequestScanPage />,
        label: 'Request Scan',
        showInNav: true
      },
      {
        path: 'scans/:id',
        element: <ScanDetailsPage />,
        label: 'Scan Details',
        showInNav: false
      },
      {
        path: 'reports',
        element: <ReportsListPage />,
        label: 'Reports',
        showInNav: true
      },
      {
        path: 'reports/:id',
        element: <ScanReportPaginated />,
        label: 'Report Details',
        showInNav: false
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
        label: 'Analytics',
        showInNav: true
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        label: 'Settings',
        showInNav: true
      },
      
      // PE-specific routes
      {
        path: 'portfolio',
        element: <PortfolioPage />,
        label: 'Portfolio Companies',
        requirePE: true,
        showInNav: true
      },
      {
        path: 'portfolio/:id/scan',
        element: <ScanReportPaginated />,
        label: 'Portfolio Scan',
        requirePE: true,
        showInNav: false
      },
      {
        path: 'portfolio/:id/deep-dive',
        element: <DeepDivePEReportPaginated />,
        label: 'Deep Dive Report',
        requirePE: true,
        showInNav: false
      },
      {
        path: 'thesis-tracking',
        element: <ThesisTrackingPage />,
        label: 'Thesis Tracking',
        requirePE: true,
        showInNav: true
      },
      
      // Admin routes - Require admin role
      {
        path: 'advisor/queue',
        element: <AdvisorQueuePage />,
        label: 'Review Queue',
        requireAdmin: true,
        showInNav: true
      },
      {
        path: 'advisor/review/:id',
        element: <AdvisorReviewPage />,
        label: 'Review',
        requireAdmin: true,
        showInNav: false
      }
    ]
  },
  
  // Fallback route
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
    showInNav: false
  }
]

// Helper function to get navigation routes
export const getNavigationRoutes = (userRole?: string): RouteConfig[] => {
  const collectNavRoutes = (routes: RouteConfig[]): RouteConfig[] => {
    const navRoutes: RouteConfig[] = []
    
    routes.forEach(route => {
      // Check if this route should be shown in navigation
      if (route.showInNav) {
        // Check role requirements
        const hasPermission = 
          (!route.requireAdmin || userRole === 'admin') &&
          (!route.requirePE || userRole === 'pe')
        
        if (hasPermission) {
          navRoutes.push({
            ...route,
            // For nested routes, we need to construct the full path
            path: route.path.startsWith('/') ? route.path : `/${route.path}`
          })
        }
      }
      
      // Recursively check children
      if (route.children) {
        const childNavRoutes = collectNavRoutes(route.children).map(child => ({
          ...child,
          // Construct full path for child routes
          path: child.path.startsWith('/') ? child.path : 
                route.path === '/' ? `/${child.path}` : `/${route.path}/${child.path}`.replace('//', '/')
        }))
        navRoutes.push(...childNavRoutes)
      }
    })
    
    return navRoutes
  }
  
  return collectNavRoutes(routeConfig)
}

// Helper function to flatten routes for React Router
export const flattenRoutes = (routes: RouteConfig[]): RouteConfig[] => {
  const flattened: RouteConfig[] = []
  
  const flatten = (routeList: RouteConfig[], parentPath = '') => {
    routeList.forEach(route => {
      const fullPath = parentPath + route.path
      flattened.push({
        ...route,
        path: fullPath
      })
      
      if (route.children) {
        flatten(route.children, fullPath === '/' ? '' : fullPath + '/')
      }
    })
  }
  
  flatten(routes)
  return flattened
} 