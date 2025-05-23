import { Link, NavLink } from 'react-router-dom'
import { BarChart3, FileText, Home, List, PanelLeft, Settings, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  isAdmin: boolean
}

export function Sidebar({ collapsed, setCollapsed, isAdmin }: SidebarProps) {
  return (
    <aside
      className={cn(
        'bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        'fixed inset-y-0 left-0 z-10 hidden flex-col border-r md:flex'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link to="/dashboard" className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <img src="/favicon.svg" alt="TechScan IQ" className="h-8 w-8" />
          {!collapsed && <span className="text-lg font-bold">TechScan IQ</span>}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex"
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
          />
          <NavItem
            to="/scans/request"
            icon={<SquarePen className="h-5 w-5" />}
            label="Request Scan"
            collapsed={collapsed}
          />
          <NavItem
            to="/reports"
            icon={<FileText className="h-5 w-5" />}
            label="Reports"
            collapsed={collapsed}
          />
          <NavItem
            to="/analytics"
            icon={<BarChart3 className="h-5 w-5" />}
            label="Analytics"
            collapsed={collapsed}
          />
          
          {isAdmin && (
            <>
              <div className={cn('my-4 border-t', collapsed ? 'mx-2' : 'mx-4')} />
              <NavItem
                to="/advisor/queue"
                icon={<List className="h-5 w-5" />}
                label="Review Queue"
                collapsed={collapsed}
              />
            </>
          )}
        </nav>
      </div>
      
      <div className="border-t p-4">
        <NavItem
          to="/settings"
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          collapsed={collapsed}
        />
      </div>
    </aside>
  )
}

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
}

function NavItem({ to, icon, label, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}