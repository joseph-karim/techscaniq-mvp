import { useState } from 'react'
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Settings, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-provider'
import { TechScanButton } from '@/components/brand'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,

} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const { signOut } = useAuth()
  const { toast } = useToast()
  const [notificationsCount, setNotificationsCount] = useState(2)
  
  const displayName = user.user_metadata?.name || user.email || 'User'
  const initials = displayName
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  const currentRole = user.user_metadata?.role || 'investor'

  const handleNotificationClick = () => {
    setNotificationsCount(0)
    toast({
      title: "Notifications Cleared",
      description: "You have read all notifications.",
      duration: 3000,
    })
  }

  return (
    <header className="border-b border-gray-200 bg-brand-white shadow-sm dark:border-brand-gunmetal dark:bg-brand-gunmetal">
      <div className="flex h-16 items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-6">
          <TechScanButton variant="ghost" size="sm" className="md:hidden p-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </TechScanButton>
          <Link to="/dashboard" className="hidden items-center gap-3 md:flex">
            <div className="flex flex-col">
              <div>
                <img src="/Tesch_Scan_IQ_Logo_Transparent.png" alt="TechScan IQ" className="h-10 w-auto dark:hidden" />
                <img src="/tech_scan_iq_logo_transparent_white_text.png" alt="TechScan IQ" className="h-10 w-auto hidden dark:block" />
                <span className="text-caption text-brand-teal font-medium font-space block -mt-1">
                  Diligence, Decoded.
                </span>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <TechScanButton 
            variant="ghost" 
            size="sm" 
            className="p-2 text-brand-gunmetal hover:text-brand-teal dark:text-brand-white dark:hover:text-brand-teal"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </TechScanButton>
          
          <TechScanButton 
            variant="ghost" 
            size="sm" 
            className="relative p-2 text-brand-gunmetal hover:text-brand-teal dark:text-brand-white dark:hover:text-brand-teal"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-error text-[10px] text-white p-0 flex items-center justify-center">
                {notificationsCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </TechScanButton>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TechScanButton 
                variant="ghost" 
                className="flex items-center gap-3 text-brand-gunmetal hover:text-brand-teal dark:text-brand-white dark:hover:text-brand-teal"
              >
                <Avatar className="h-8 w-8 border border-gray-200 dark:border-brand-gunmetal">
                  <AvatarFallback className="bg-brand-teal/10 text-brand-teal font-medium font-space">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden items-center gap-2 md:flex">
                  <span className="text-body-sm font-medium text-brand-gunmetal dark:text-brand-white font-ibm">
                    {displayName}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              </TechScanButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="px-3 py-3 border-b border-gray-200">
                <p className="text-body-sm font-medium text-brand-gunmetal font-space">{displayName}</p>
                <p className="text-caption text-muted-foreground font-ibm">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-brand-teal text-white text-[10px] px-2 py-1 h-5 rounded-sm font-medium font-space">
                    {currentRole === 'investor' ? 'Investor' : currentRole === 'admin' ? 'Admin' : 'PE'}
                  </Badge>
                  {user.user_metadata?.workspace_name && (
                    <span className="text-caption text-muted-foreground font-ibm">
                      {user.user_metadata.workspace_name}
                    </span>
                  )}
                </div>
              </div>
              
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer py-2 px-3 rounded-sm hover:bg-brand-teal/5">
                  <UserIcon className="mr-3 h-4 w-4 text-brand-teal" />
                  <span className="text-body-sm font-ibm">My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer py-2 px-3 rounded-sm hover:bg-brand-teal/5">
                  <Settings className="mr-3 h-4 w-4 text-brand-teal" />
                  <span className="text-body-sm font-ibm">Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                className="flex cursor-pointer py-2 px-3 rounded-sm text-error hover:bg-error/5" 
                onClick={() => signOut()}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-body-sm font-ibm">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}