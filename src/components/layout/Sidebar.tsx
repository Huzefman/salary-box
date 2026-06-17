import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  BarChart3,
  Settings,
  Building2,
  User,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils'

type NavSubItem = {
  label: string
  href: string
  roles?: string[]
}

type NavGroup = {
  label: string
  icon: React.ElementType
  href?: string
  roles?: string[]
  children?: NavSubItem[]
}

const NAV_GROUPS: NavGroup[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Employees',
    icon: Users,
    roles: ['owner', 'hr', 'system_admin'],
    children: [
      { label: 'All Employees', href: '/employees', roles: ['owner', 'hr', 'system_admin'] },
      { label: 'Add Employee', href: '/employees/new', roles: ['owner'] },
      { label: 'Bulk Import', href: '/employees/bulk-import', roles: ['owner'] },
    ],
  },
  {
    label: 'Attendance',
    icon: Clock,
    children: [
      { label: 'My Attendance', href: '/attendance', roles: ['owner', 'hr', 'employee'] },
      { label: 'Team Attendance', href: '/attendance/team', roles: ['owner', 'hr'] },
      { label: 'Regularization', href: '/attendance/regularization', roles: ['owner', 'hr', 'employee'] },
    ],
  },
  {
    label: 'Leave',
    icon: Calendar,
    children: [
      { label: 'Leave Dashboard', href: '/leave', roles: ['owner', 'hr', 'employee'] },
      { label: 'Apply Leave', href: '/leave/apply', roles: ['owner', 'hr', 'employee'] },
      { label: 'Team Leave', href: '/leave/team', roles: ['owner', 'hr'] },
      { label: 'Holiday Calendar', href: '/leave/holidays', roles: ['owner', 'hr', 'employee'] },
      { label: 'Comp-Off', href: '/leave/comp-off/request', roles: ['owner', 'hr', 'employee'] },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    roles: ['owner', 'hr', 'system_admin'],
    children: [
      { label: 'Attendance Report', href: '/reports/attendance', roles: ['owner', 'hr'] },
      { label: 'Leave Report', href: '/reports/leave', roles: ['owner', 'hr'] },
      { label: 'Headcount', href: '/reports/headcount', roles: ['owner', 'system_admin'] },
      { label: 'Regularization Log', href: '/reports/regularization', roles: ['owner'] },
      { label: 'Heatmap', href: '/reports/heatmap', roles: ['owner'] },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    roles: ['owner', 'hr', 'system_admin'],
    children: [
      { label: 'Departments', href: '/settings/departments', roles: ['owner'] },
      { label: 'Designations', href: '/settings/designations', roles: ['owner'] },
      { label: 'Shifts', href: '/settings/shifts', roles: ['owner', 'hr'] },
      { label: 'Leave Types', href: '/settings/leave-types', roles: ['owner'] },
      { label: 'IP Whitelist', href: '/settings/ip-whitelist', roles: ['owner', 'system_admin'] },
      { label: 'Geofence', href: '/settings/geofence', roles: ['owner', 'system_admin'] },
      { label: 'Notifications', href: '/settings/notifications', roles: ['owner'] },
      { label: 'Onboarding', href: '/settings/onboarding-checklist', roles: ['owner'] },
      { label: 'App Config', href: '/settings/app-config', roles: ['owner'] },
    ],
  },
]

function EmployeeNav() {
  return (
    <>
      <NavItem icon={LayoutDashboard} href="/dashboard" label="Dashboard" />
      <NavItem icon={User} href="/employees/me" label="My Profile" />
      <NavItem icon={Clock} href="/attendance" label="My Attendance" />
      <NavGroupItem
        icon={Calendar}
        label="My Leave"
        children={[
          { label: 'Apply Leave', href: '/leave/apply' },
          { label: 'Leave Dashboard', href: '/leave' },
          { label: 'Comp-Off', href: '/leave/comp-off/request' },
          { label: 'Holiday Calendar', href: '/leave/holidays' },
        ]}
      />
      <NavItem icon={BarChart3} href="/reports/attendance" label="My Reports" />
    </>
  )
}

function NavItem({ icon: Icon, href, label }: { icon: React.ElementType; href: string; label: string }) {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

function NavGroupItem({
  icon: Icon,
  label,
  children,
  defaultOpen,
}: {
  icon: React.ElementType
  label: string
  children: { label: string; href: string }[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
          {children.map((child) => (
            <NavLink
              key={child.href}
              to={child.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { role } = useRole()

  if (role === 'employee') {
    return (
      <aside className="flex w-56 flex-col border-r bg-background">
        <Link to="/dashboard" className="flex h-14 items-center gap-2 border-b px-4">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="font-semibold">HR Tool</span>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          <EmployeeNav />
        </nav>
      </aside>
    )
  }

  const visibleGroups = NAV_GROUPS.filter(
    (group) => !group.roles || (role && group.roles.includes(role))
  ).map((group) => ({
    ...group,
    children: group.children?.filter(
      (child) => !child.roles || (role && child.roles.includes(role))
    ),
  }))

  return (
    <aside className="flex w-56 flex-col border-r bg-background">
      <Link to="/dashboard" className="flex h-14 items-center gap-2 border-b px-4">
        <Building2 className="h-5 w-5 text-primary" />
        <span className="font-semibold">HR Tool</span>
      </Link>
      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-1">
          {visibleGroups.map((group) => {
            if (!group.children || group.children.length === 0) {
              return (
                <NavItem
                  key={group.href!}
                  icon={group.icon}
                  href={group.href!}
                  label={group.label}
                />
              )
            }
            if (group.children.length === 1) {
              return (
                <NavItem
                  key={group.children[0].href}
                  icon={group.icon}
                  href={group.children[0].href}
                  label={group.children[0].label}
                />
              )
            }
            return (
              <NavGroupItem
                key={group.label}
                icon={group.icon}
                label={group.label}
                children={group.children.map((c) => ({ label: c.label, href: c.href }))}
                defaultOpen={true}
              />
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
