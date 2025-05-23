import { User } from '@supabase/supabase-js'
import { 
  Bell, 
  ChevronDown, 
  HelpCircle, 
  LogOut, 
  Menu, 
  Settings, 
  User as UserIcon 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const { signOut } = useAuth()
  const displayName = user.user_metadata?.name || user.email || 'User'
  const initials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link to="/dashboard" className="hidden items-center gap-2 md:flex">
            <img src="/favicon.svg" alt="TechScan IQ" className="h-8 w-8" />
            <span className="text-lg font-bold">TechScan IQ</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
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
              </div>
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