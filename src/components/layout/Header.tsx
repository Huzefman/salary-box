import { Menu, Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from './NotificationBell'

type Props = { onToggleSidebar: () => void }

export function Header({ onToggleSidebar }: Props) {
  const employee = useAuthStore((s) => s.employee)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { theme, setTheme } = useTheme()
  const isMobile = !useMediaQuery('(min-width: 768px)')

  async function handleSignOut() {
    await supabase.auth.signOut()
    clearAuth()
  }

  const initials = employee
    ? `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()
    : '?'

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        {isMobile && (
          <button onClick={onToggleSidebar} className="rounded-md p-1.5 hover:bg-accent">
            <span className="sr-only">Toggle sidebar</span>
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md p-1 hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hover:text-foreground truncate max-w-[120px] md:max-w-none hidden sm:inline">
                {employee?.first_name} {employee?.last_name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{employee?.first_name} {employee?.last_name}</p>
                <p className="text-xs text-muted-foreground">{employee?.employee_code}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('light')} className={theme === 'light' ? 'bg-accent' : ''}>
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className={theme === 'dark' ? 'bg-accent' : ''}>
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className={theme === 'system' ? 'bg-accent' : ''}>
              <Monitor className="h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
