import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { RoleBasedRedirect } from '@/components/auth/role-based-redirect'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const RequestScanPage = lazy(() => import('@/pages/scans/request-scan'))
const ViewReportPage = lazy(() => import('@/pages/reports/view-report'))
const AdvisorReviewPage = lazy(() => import('@/pages/advisor/review'))
const AdvisorQueuePage = lazy(() => import('@/pages/advisor/queue'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard'))
const AdminScanConfigPage = lazy(() => import('@/pages/admin/scan-config'))
const AdminPipelineConfigPage = lazy(() => import('@/pages/admin/pipeline-config'))
const AdminPipelineMonitorPage = lazy(() => import('@/pages/admin/pipeline-monitor'))
const AdminSalesIntelligenceReportPage = lazy(() => import('@/pages/admin/sales-intelligence-report-router'))
const AdminPETechDiligenceReportPage = lazy(() => import('@/pages/admin/pe-tech-diligence-report-router'))
const PortfolioPage = lazy(() => import('@/pages/pe/portfolio'))
const ThesisTrackingPage = lazy(() => import('@/pages/pe/thesis-tracking'))
const DeepDivePEReportPaginated = lazy(() => import('@/pages/pe/deep-dive-report-paginated'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const AnalyticsPage = lazy(() => import('@/pages/analytics'))
const ReportsListPage = lazy(() => import('@/pages/reports/reports-list'))
const GenerateExecutiveReport = lazy(() => import('@/pages/reports/GenerateExecutiveReport'))
const ThesisAlignedReport = lazy(() => import('@/pages/reports/thesis-aligned-report'))
const AIWorkflowResults = lazy(() => import('@/pages/demo/ai-workflow-results'))
const AdminScansPage = lazy(() => import('@/pages/admin/admin-scans'))
const AdminScanRequestPage = lazy(() => import('@/pages/admin/admin-scan-request'))
const AdminScanDetailsPage = lazy(() => import('@/pages/admin/admin-scan-details'))
const AdminLangGraphReportPage = lazy(() => import('@/pages/admin/langgraph-report/[id]'))
const GenerateLangGraphReport = lazy(() => import('@/pages/reports/GenerateLangGraphReport'))
const CSPTestPage = lazy(() => import('@/pages/test/csp-test'))


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
        element: <RoleBasedRedirect />,
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
        element: <ViewReportPage />,
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
        path: 'reports/generate',
        element: <GenerateExecutiveReport />,
        label: 'Generate Report',
        showInNav: false
      },
      {
        path: 'reports/:id',
        element: <ViewReportPage />,
        label: 'Report Details',
        showInNav: false
      },
      {
        path: 'reports/thesis-aligned/:id',
        element: <ThesisAlignedReport />,
        label: 'Thesis-Aligned Report',
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
      {
        path: 'demo/ai-workflow-results',
        element: <AIWorkflowResults />,
        label: 'AI Workflow Demo',
        showInNav: false
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
        element: <ViewReportPage />,
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
        path: 'admin/dashboard',
        element: <AdminDashboardPage />,
        label: 'Admin Dashboard',
        requireAdmin: true,
        showInNav: true
      },
      {
        path: 'admin/scan-config/:id',
        element: <AdminScanConfigPage />,
        label: 'Scan Configuration',
        requireAdmin: true,
        showInNav: false
      },
      {
        path: 'admin/pipeline-config',
        element: <AdminPipelineConfigPage />,
        label: 'Pipeline Configuration',
        requireAdmin: true,
        showInNav: true
      },
      {
        path: 'admin/pipeline-monitor',
        element: <AdminPipelineMonitorPage />,
        label: 'Pipeline Monitor',
        requireAdmin: true,
        showInNav: true
      },
      {
        path: 'admin/scans',
        element: <AdminScansPage />,
        label: 'Admin Scans',
        requireAdmin: true,
        showInNav: true
      },
      {
        path: 'admin/scans/new',
        element: <AdminScanRequestPage />,
        label: 'New Admin Scan',
        requireAdmin: true,
        showInNav: false
      },
      {
        path: 'admin/scans/:id',
        element: <AdminScanDetailsPage />,
        label: 'Admin Scan Details',
        requireAdmin: true,
        showInNav: false
      },
      {
        path: 'admin/sales-intelligence',
        element: <Navigate to="/admin/sales-intelligence/bmo" replace />,
        label: 'Sales Intelligence',
        requireAdmin: true,
        showInNav: true
      },
      {
        path: 'admin/sales-intelligence/:accountId',
        element: <AdminSalesIntelligenceReportPage />,
        label: 'Sales Intelligence Report',
        requireAdmin: true,
        showInNav: false
      },
      {
        path: 'admin/pe-diligence',
        element: <Navigate to="/admin/pe-diligence/snowplow" replace />,
        label: 'PE Diligence',
        requireAdmin: true,
        showInNav: true
      },
      {
        path: 'admin/pe-diligence/:companyId',
        element: <AdminPETechDiligenceReportPage />,
        label: 'PE Tech Diligence Report',
        requireAdmin: true,
        showInNav: false
      },
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
      },
      {
        path: 'admin/langgraph-report/:id',
        element: <AdminLangGraphReportPage />,
        label: 'LangGraph Report',
        requireAdmin: true,
        showInNav: false
      },
      {
        path: 'reports/generate-langgraph',
        element: <GenerateLangGraphReport />,
        label: 'Generate LangGraph Report',
        requireAdmin: false,
        showInNav: false
      },
      {
        path: 'test/csp-test',
        element: <CSPTestPage />,
        label: 'CSP Test',
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

// Helper function to flatten routes for React Router
export const flattenRoutes = (routes: RouteConfig[]): RouteConfig[] => {
  const flattened: RouteConfig[] = [];
  const flatten = (routeList: RouteConfig[], parentPath = '') => {
    routeList.forEach(route => {
      let currentParentPath = parentPath;
      // Ensure parentPath ends with a slash if it's not empty and not already '/',
      // and route.path is not absolute and not empty.
      if (currentParentPath && currentParentPath !== '/' && !currentParentPath.endsWith('/') && route.path && !route.path.startsWith('/')) {
        currentParentPath += '/';
      }

      let fullPath = route.path?.startsWith('/') 
        ? route.path 
        : (currentParentPath + (route.path || '')).replace(/\/\//g, '/');

      if (fullPath !== '/' && fullPath.endsWith('/') && route.path !== '') { // Don't remove trailing slash if path was empty (root child)
        fullPath = fullPath.slice(0, -1);
      }
      if (fullPath === '' && parentPath === '/' && route.path === '') { // Handles the Navigate component at root
         fullPath = '/';
      } else if (fullPath === '' && parentPath === '' && route.path === '') {
         fullPath = '/';
      }

      flattened.push({
        ...route,
        path: fullPath,
      });

      if (route.children) {
        flatten(route.children, fullPath === '/' && route.path === '' ? '/' : fullPath) // Pass '/' if it's a root layout child, otherwise fullPath
      }
    });
  };
  flatten(routes);
  return flattened;
};

// Updated helper function to get navigation routes
export const getNavigationRoutes = (userRole?: string): RouteConfig[] => {
  const allFlattenedRoutes = flattenRoutes(routeConfig); // Step 1: Flatten all routes
  const navRoutes: RouteConfig[] = [];

  allFlattenedRoutes.forEach(route => {
    // Step 2: Filter based on showInNav and permissions
    if (route.showInNav) {
      const hasPermission =
        (!route.requireAdmin || userRole === 'admin') &&
        (!route.requirePE || userRole === 'pe');

      if (hasPermission) {
        // The path is already absolute and correct from flattenRoutes
        navRoutes.push(route);
      }
    }
  });

  return navRoutes; // Step 3: Return the filtered list
}; 