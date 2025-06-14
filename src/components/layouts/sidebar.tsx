import { Link, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, FileText, Home, List, PanelLeft, Settings, PenSquare as SquarePen, Building2, TrendingUp, Activity, Briefcase, FileSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/auth-provider'
import { getNavigationRoutes } from '@/routes'

// Icon mapping for routes
const iconMap = {
  'Dashboard': Home,
  'Request Scan': SquarePen,
  'Reports': FileText,
  'Analytics': BarChart3,
  'Portfolio Companies': Building2,
  'Thesis Tracking': TrendingUp,
  'Review Queue': List,
  'Pipeline Monitor': Activity,
  'Pipeline Configuration': Settings,
  'Admin Dashboard': Home,
  'Sales Intelligence': Briefcase,
  'PE Diligence': FileSearch,
  'Settings': Settings,
}

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isAdmin: boolean
}

export function Sidebar({ collapsed, setCollapsed, isAdmin }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const userRole = user?.user_metadata?.role
  const isPE = userRole === 'pe'
  const pendingReviewCount = isAdmin ? 3 : 0 // Mock pending reviews count
  
  // Get navigation routes based on user role
  const navigationRoutes = getNavigationRoutes(userRole)

  return (
    <aside
      className={cn(
        'bg-deep-navy text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        'fixed inset-y-0 left-0 z-10 hidden flex-col border-r border-slate-800 md:flex'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <Link to="/dashboard" className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          {!collapsed ? (
            <img src="/tech_scan_iq_logo_transparent_white_text.png" alt="TechScan IQ" className="h-8 w-auto" />
          ) : (
            <img src="/Techscan Q.png" alt="TechScan IQ" className="h-8 w-8" />
          )}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden text-slate-400 hover:text-white hover:bg-slate-800 md:flex"
        >
          <PanelLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <nav className="space-y-1 px-2 py-4">
          {/* Main navigation routes (non-role-specific) */}
          {navigationRoutes
            .filter(route => !route.requirePE && !route.requireAdmin)
            .map((route) => {
              const IconComponent = iconMap[route.label as keyof typeof iconMap] || FileText
              const isActive = route.path === '/dashboard' 
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(route.path)
              
              return (
                <NavItem
                  key={route.path}
                  to={route.path}
                  icon={<IconComponent className="h-5 w-5" />}
                  label={route.label || ''}
                  collapsed={collapsed}
                  active={isActive}
                />
              )
            })}
          
          {/* PE Section */}
          {isPE && navigationRoutes.some(route => route.requirePE) && (
            <>
              <div className={cn('my-6 border-t border-gray-800', collapsed ? 'mx-2' : 'mx-4')} />
              <div className="px-3 py-2">
                <p className={collapsed ? 'sr-only' : 'mb-2 text-xs uppercase tracking-wider text-slate-500'}>
                  Private Equity
                </p>
              </div>
              {navigationRoutes
                .filter(route => route.requirePE)
                .map((route) => {
                  const IconComponent = iconMap[route.label as keyof typeof iconMap] || Building2
                  const isActive = location.pathname.startsWith(route.path)
                  
                  return (
                    <NavItem
                      key={route.path}
                      to={route.path}
                      icon={<IconComponent className="h-5 w-5" />}
                      label={route.label || ''}
                      collapsed={collapsed}
                      active={isActive}
                    />
                  )
                })}
            </>
          )}
          
          {/* Admin Section */}
          {isAdmin && navigationRoutes.some(route => route.requireAdmin) && (
            <>
              <div className={cn('my-4 border-t border-slate-800', collapsed ? 'mx-2' : 'mx-4')} />
              <div className="px-3 py-2">
                <p className={collapsed ? 'sr-only' : 'mb-2 text-xs uppercase tracking-wider text-slate-500'}>
                  Admin
                </p>
              </div>
              {navigationRoutes
                .filter(route => route.requireAdmin)
                .map((route) => {
                  const IconComponent = iconMap[route.label as keyof typeof iconMap] || List
                  const isActive = location.pathname.startsWith(route.path)
                  
                  return (
                    <NavItem
                      key={route.path}
                      to={route.path}
                      icon={<IconComponent className="h-5 w-5" />}
                      label={route.label || ''}
                      collapsed={collapsed}
                      active={isActive}
                      badge={route.label === 'Review Queue' && pendingReviewCount > 0 ? pendingReviewCount.toString() : undefined}
                    />
                  )
                })}
            </>
          )}
        </nav>
      </div>
      
      <div className="border-t border-slate-800 p-4">
        <NavItem
          to="/settings"
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          collapsed={collapsed}
          active={location.pathname === '/settings'}
        />
        
        {!collapsed && (
          <div className="mt-4 rounded-md bg-slate-800/50 p-3">
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-electric-teal"></div>
              <span className="text-sm font-medium">
                {user?.user_metadata.role === 'admin' ? 'Admin' : 
                 user?.user_metadata.role === 'pe' ? 'PE' : 'Investor'} Mode
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {user?.user_metadata.role === 'admin' 
                ? 'You have advisor privileges' 
                : user?.user_metadata.role === 'pe'
                ? 'Private equity view active'
                : 'Investor view active'}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  badge?: string
  collapsed: boolean
  active: boolean
}

function NavItem({ to, icon, label, badge, collapsed, active }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={() =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-brand-digital-teal text-white'
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && (
            <Badge className="h-5 w-5 justify-center rounded-full bg-brand-digital-teal text-white p-0 text-xs">
              {badge}
            </Badge>
          )}
        </>
      )}
      {collapsed && badge && (
        <Badge className="absolute right-1 top-1 h-4 w-4 justify-center rounded-full bg-brand-digital-teal text-white p-0 text-[10px]">
          {badge}
        </Badge>
      )}
    </NavLink>
  )
}