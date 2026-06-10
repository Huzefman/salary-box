import { useQuery } from '@tanstack/react-query'
import {
  fetchEmployee,
  fetchEmployees,
  fetchDepartments,
  fetchDesignations,
  fetchActiveManagers,
} from './api'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees', 'list'],
    queryFn: fetchEmployees,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', 'detail', id],
    queryFn: () => fetchEmployee(id),
    enabled: !!id,
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments', 'list'],
    queryFn: fetchDepartments,
  })
}

export function useDesignations() {
  return useQuery({
    queryKey: ['designations', 'list'],
    queryFn: fetchDesignations,
  })
}

export function useActiveManagers() {
  return useQuery({
    queryKey: ['employees', 'managers'],
    queryFn: fetchActiveManagers,
  })
}
