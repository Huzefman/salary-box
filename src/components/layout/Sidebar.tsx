import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Settings,
  Building2,
} from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  roles?: ReturnType<typeof useRole>['role'][]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/employees', icon: Users, roles: ['owner', 'hr', 'system_admin'] },
  { label: 'Attendance', href: '/attendance', icon: Clock },
  { label: 'Leave', href: '/leave', icon: Calendar },
  { label: 'Settings', href: '/settings/departments', icon: Settings, roles: ['owner', 'hr', 'system_admin'] },
]

export function Sidebar() {
  const { role } = useRole()

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  )

  return (
    <aside className="flex w-56 flex-col border-r bg-background">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Building2 className="h-5 w-5 text-primary" />
        <span className="font-semibold">HR Tool</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {visible.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
