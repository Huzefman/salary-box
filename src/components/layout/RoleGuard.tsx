import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/hooks/useAuth'
import type { Role } from '@/types'

export function RequireAuth() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireRole({ allow }: { allow: Role[] }) {
  const role = useAuthStore((s) => s.role)
  if (!role || !allow.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
