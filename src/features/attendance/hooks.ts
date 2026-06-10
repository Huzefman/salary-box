import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/hooks/useAuth'
import { fetchMyAttendance, fetchTodayAttendance } from './api'

export function useMyAttendance(year: number, month: number) {
  const employeeId = useAuthStore((s) => s.employee?.id)
  return useQuery({
    queryKey: ['attendance', 'list', employeeId, year, month],
    queryFn: () => fetchMyAttendance(employeeId!, year, month),
    enabled: !!employeeId,
  })
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
