import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Employee, Role } from '@/types'

type AuthState = {
  user: User | null
  employee: Employee | null
  role: Role | null
  isLoading: boolean
  setAuth: (user: User, employee: Employee) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  employee: null,
  role: null,
  isLoading: true,
  setAuth: (user, employee) =>
    set({ user, employee, role: employee.role, isLoading: false }),
  clearAuth: () =>
    set({ user: null, employee: null, role: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))
