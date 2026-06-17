import { useQuery } from '@tanstack/react-query'
import {
  fetchEmployee,
  fetchEmployees,
  fetchDepartments,
  fetchDesignations,
  fetchActiveManagers,
  fetchEmployeeDocuments,
  fetchEmployeeLifecycleEvents,
  fetchEmployeeBankDetails,
  fetchEmployeeOnboardingProgress,
  fetchEmployeeAttendanceCurrentMonth,
  fetchEmployeeLeaveBalancesWithType,
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

export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: ['employees', 'documents', employeeId],
    queryFn: () => fetchEmployeeDocuments(employeeId),
    enabled: !!employeeId,
  })
}

export function useEmployeeLifecycleEvents(employeeId: string) {
  return useQuery({
    queryKey: ['employees', 'lifecycle', employeeId],
    queryFn: () => fetchEmployeeLifecycleEvents(employeeId),
    enabled: !!employeeId,
  })
}

export function useEmployeeBankDetails(employeeId: string) {
  return useQuery({
    queryKey: ['employees', 'bank', employeeId],
    queryFn: () => fetchEmployeeBankDetails(employeeId),
    enabled: !!employeeId,
  })
}

export function useEmployeeOnboardingProgress(employeeId: string) {
  return useQuery({
    queryKey: ['employees', 'onboarding', employeeId],
    queryFn: () => fetchEmployeeOnboardingProgress(employeeId),
    enabled: !!employeeId,
  })
}

export function useEmployeeAttendanceCurrentMonth(employeeId: string) {
  return useQuery({
    queryKey: ['employees', 'attendance', employeeId, 'current-month'],
    queryFn: () => fetchEmployeeAttendanceCurrentMonth(employeeId),
    enabled: !!employeeId,
  })
}

export function useEmployeeLeaveBalances(employeeId: string) {
  return useQuery({
    queryKey: ['employees', 'leave-balances', employeeId],
    queryFn: () => fetchEmployeeLeaveBalancesWithType(employeeId),
    enabled: !!employeeId,
  })
}
