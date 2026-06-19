import { Bell, Menu } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useMediaQuery } from '@/hooks/useMediaQuery'

type Props = { onToggleSidebar: () => void }

export function Header({ onToggleSidebar }: Props) {
  const employee = useAuthStore((s) => s.employee)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const isMobile = !useMediaQuery('(min-width: 768px)')

  async function handleSignOut() {
    await supabase.auth.signOut()
    clearAuth()
  }

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
        <button className="relative rounded-md p-1.5 hover:bg-accent">
          <Bell className="h-5 w-5" />
        </button>
        <button
          onClick={handleSignOut}
          className="text-sm text-muted-foreground hover:text-foreground truncate max-w-[120px] md:max-w-none"
        >
          {employee?.first_name} {employee?.last_name}
        </button>
      </div>
    </header>
  )
}
