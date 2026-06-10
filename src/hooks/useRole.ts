import { useAuthStore } from './useAuth'
import type { Role } from '@/types'

export function useRole() {
  const role = useAuthStore((s) => s.role)

  return {
    role,
    isOwner: role === 'owner',
    isHR: role === 'hr',
    isEmployee: role === 'employee',
    isSystemAdmin: role === 'system_admin',
    isAdminOrHR: role === 'owner' || role === 'hr',
    can: (allowed: Role[]) => role !== null && allowed.includes(role),
  }
}
