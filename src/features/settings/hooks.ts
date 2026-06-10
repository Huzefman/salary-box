import { useQuery } from '@tanstack/react-query'
import { fetchAppConfig, fetchHolidays } from './api'

export function useAppConfig() {
  return useQuery({
    queryKey: ['config', 'app'],
    queryFn: fetchAppConfig,
    staleTime: 30 * 60 * 1000,
  })
}

export function useHolidays(year: number) {
  return useQuery({
    queryKey: ['holidays', year],
    queryFn: () => fetchHolidays(year),
  })
}
