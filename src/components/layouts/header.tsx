import { useState } from 'react'
import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Settings, User as UserIcon, UserCog, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/mock-auth-provider'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MockUser } from '@/lib/auth/mock-auth-provider'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  user: MockUser
}

export function Header({ user }: HeaderProps) {
  const { signOut, switchRole } = useAuth()
  const { toast } = useToast()
  const [notificationsCount, setNotificationsCount] = useState(2)
  
  const displayName = user.user_metadata?.name || user.email || 'User'
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  const currentRole = user.user_metadata?.role || 'investor'

  const handleRoleSwitch = (role: string) => {
    switchRole(role as 'investor' | 'admin' | 'pe')
    
    const roleDisplayName = role === 'investor' ? 'Investor' : role === 'admin' ? 'Admin' : 'Private Equity'
    
    toast({
      title: "Profile Switched",
      description: `You are now using the ${roleDisplayName} profile.`,
      duration: 3000,
    })
  }

  const handleNotificationClick = () => {
    setNotificationsCount(0)
    toast({
      title: "Notifications Cleared",
      description: "You have read all notifications.",
      duration: 3000,
    })
  }

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-deep-navy">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link to="/dashboard" className="hidden items-center gap-2 md:flex">
            <img src="/favicon.svg" alt="TechScan IQ" className="h-8 w-8" />
            <span className="text-lg font-bold text-deep-navy dark:text-white">TechScan IQ</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100 hover:text-deep-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-slate-600 hover:bg-slate-100 hover:text-deep-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-risk-red text-[10px] text-white">
                {notificationsCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 hover:text-deep-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
                <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                  <AvatarFallback className="bg-electric-teal/10 text-electric-teal">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden items-center gap-1 md:flex">
                  <span className="text-sm font-medium">{displayName}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Badge className="bg-electric-teal text-[10px] px-1.5 py-0 h-4 rounded-sm font-normal">
                    {currentRole === 'investor' ? 'Investor' : currentRole === 'admin' ? 'Admin' : 'PE'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{user.user_metadata?.workspace_name}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              
              <DropdownMenuRadioGroup value={currentRole} onValueChange={handleRoleSwitch}>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  SWITCH PROFILE
                </div>
                <DropdownMenuRadioItem value="investor" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Investor</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="admin" className="gap-2">
                  <UserCog className="h-4 w-4" />
                  <span>Admin</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pe" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Private Equity</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex cursor-pointer" 
                onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}