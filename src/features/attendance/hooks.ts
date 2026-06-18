import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/hooks/useAuth'
import { fetchMyAttendance, fetchTodayAttendance, fetchRegularizationHistory, fetchAppConfig } from './api'

export function useMyAttendance(year: number, month: number) {
  const employeeId = useAuthStore((s) => s.employee?.id)
  return useQuery({
    queryKey: ['attendance', 'list', employeeId, year, month],
    queryFn: () => fetchMyAttendance(employeeId!, year, month),
    enabled: !!employeeId,
  })
}

export function useMyAttendanceCurrentMonth() {
  const now = new Date()
  return useMyAttendance(now.getFullYear(), now.getMonth() + 1)
}

export function useTodayAttendance() {
  const employeeId = useAuthStore((s) => s.employee?.id)
  return useQuery({
    queryKey: ['attendance', 'today', employeeId],
    queryFn: () => fetchTodayAttendance(employeeId!),
    enabled: !!employeeId,
    refetchInterval: 60 * 1000,
  })
}

export function useRegularizationHistory() {
  const employeeId = useAuthStore((s) => s.employee?.id)
  return useQuery({
    queryKey: ['attendance', 'regularization', employeeId],
    queryFn: () => fetchRegularizationHistory(employeeId!),
    enabled: !!employeeId,
  })
}

export function useAppConfig(key: string) {
  return useQuery({
    queryKey: ['app_config', key],
    queryFn: () => fetchAppConfig(key),
  })
}
