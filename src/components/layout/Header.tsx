import { Bell } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function Header() {
  const employee = useAuthStore((s) => s.employee)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  async function handleSignOut() {
    await supabase.auth.signOut()
    clearAuth()
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-1.5 hover:bg-accent">
          <Bell className="h-5 w-5" />
        </button>
        <button
          onClick={handleSignOut}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {employee?.first_name} {employee?.last_name}
        </button>
      </div>
    </header>
  )
}
