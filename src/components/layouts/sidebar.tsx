import { Link, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, FileText, Home, List, PanelLeft, Settings, PenSquare as SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/mock-auth-provider'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isAdmin: boolean
}

export function Sidebar({ collapsed, setCollapsed, isAdmin }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const pendingReviewCount = isAdmin ? 3 : 0 // Mock pending reviews count

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
          <img src="/favicon.svg" alt="TechScan IQ" className="h-8 w-8" />
          {!collapsed && <span className="text-lg font-bold text-white">TechScan IQ</span>}
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
          <NavItem
            to="/dashboard"
            icon={<Home className="h-5 w-5" />}
            label="Dashboard"
            collapsed={collapsed}
            active={location.pathname === '/dashboard'}
          />
          <NavItem
            to="/scans/request"
            icon={<SquarePen className="h-5 w-5" />}
            label="Request Scan"
            collapsed={collapsed}
            active={location.pathname === '/scans/request'}
          />
          <NavItem
            to="/reports"
            icon={<FileText className="h-5 w-5" />}
            label="Reports"
            collapsed={collapsed}
            active={location.pathname.startsWith('/reports')}
          />
          <NavItem
            to="/analytics"
            icon={<BarChart3 className="h-5 w-5" />}
            label="Analytics"
            collapsed={collapsed}
            active={location.pathname === '/analytics'}
          />
          
          {isAdmin && (
            <>
              <div className={cn('my-4 border-t border-slate-800', collapsed ? 'mx-2' : 'mx-4')} />
              <div className="px-3 py-2">
                <p className={collapsed ? 'sr-only' : 'mb-2 text-xs uppercase tracking-wider text-slate-500'}>
                  Admin
                </p>
              </div>
              <NavItem
                to="/advisor/queue"
                icon={<List className="h-5 w-5" />}
                label="Review Queue"
                badge={pendingReviewCount > 0 ? pendingReviewCount.toString() : undefined}
                collapsed={collapsed}
                active={location.pathname.startsWith('/advisor')}
              />
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
                {user?.user_metadata.role === 'admin' ? 'Admin' : 'Investor'} Mode
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {user?.user_metadata.role === 'admin' 
                ? 'You have advisor privileges' 
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
            ? 'bg-electric-teal text-white'
            : 'text-slate-400 hover:bg-deep-navy/50 hover:text-white',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && (
            <Badge className="h-5 w-5 justify-center rounded-full bg-electric-teal p-0 text-xs">
              {badge}
            </Badge>
          )}
        </>
      )}
      {collapsed && badge && (
        <Badge className="absolute right-1 top-1 h-4 w-4 justify-center rounded-full bg-electric-teal p-0 text-[10px]">
          {badge}
        </Badge>
      )}
    </NavLink>
  )
}