import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth/mock-auth-provider'
import { Header } from '@/components/layouts/header'
import { Sidebar } from '@/components/layouts/sidebar'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  // Don't render layout until we have user data
  if (!user) {
    return null
  }

  const isAdmin = user.user_metadata?.role === 'admin'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isAdmin={isAdmin} />
      
      {/* Main content - adjust margin based on sidebar state */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden",
        collapsed ? "md:ml-16" : "md:ml-64" // Match sidebar width
      )}>
        <Header user={user} />
        <main className="flex-1 overflow-auto bg-muted/20 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}