import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-provider'
import { Header } from '@/components/layouts/header'
import { Sidebar } from '@/components/layouts/sidebar'

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
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto bg-muted/20 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}