import { useState } from 'react'
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Settings, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
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
    <header className="border-b border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-brand-gunmetal-gray">
      <div className="flex h-16 items-center justify-between px-6 md:px-8">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link to="/dashboard" className="hidden items-center gap-3 md:flex">
            <div className="flex flex-col">
              <img src="/techscan_iq_logo.png" alt="TechScan IQ" className="h-10 w-auto" />
              <span className="text-caption text-brand-digital-teal font-medium -mt-1">
                Diligence, Decoded.
              </span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:bg-gray-50 hover:text-brand-gunmetal-gray dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-muted-foreground hover:bg-gray-50 hover:text-brand-gunmetal-gray dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-risk-red text-[10px] text-white p-0 flex items-center justify-center">
                {notificationsCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-3 text-muted-foreground hover:bg-gray-50 hover:text-brand-gunmetal-gray dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <Avatar className="h-8 w-8 border border-gray-200 dark:border-slate-700">
                  <AvatarFallback className="bg-brand-digital-teal/10 text-brand-digital-teal font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden items-center gap-2 md:flex">
                  <span className="text-body-sm font-medium text-brand-gunmetal-gray dark:text-white">
                    {displayName}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="px-3 py-3 border-b border-gray-100">
                <p className="text-body-sm font-medium text-brand-gunmetal-gray">{displayName}</p>
                <p className="text-caption text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-brand-digital-teal text-white text-[10px] px-2 py-1 h-5 rounded-sm font-medium">
                    {currentRole === 'investor' ? 'Investor' : currentRole === 'admin' ? 'Admin' : 'PE'}
                  </Badge>
                  {user.user_metadata?.workspace_name && (
                    <span className="text-caption text-muted-foreground">
                      {user.user_metadata.workspace_name}
                    </span>
                  )}
                </div>
              </div>
              
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer py-2 px-3 rounded-sm">
                  <UserIcon className="mr-3 h-4 w-4 text-brand-digital-teal" />
                  <span className="text-body-sm">My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer py-2 px-3 rounded-sm">
                  <Settings className="mr-3 h-4 w-4 text-brand-digital-teal" />
                  <span className="text-body-sm">Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                className="flex cursor-pointer py-2 px-3 rounded-sm text-risk-red hover:bg-red-50" 
                onClick={() => signOut()}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-body-sm">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}