import type { Employee } from '@/types'

export type EmployeeStatusBadgeVariant = 'active' | 'inactive' | 'terminated' | 'future_joiner'

export type LifecycleEventType =
  | 'promotion'
  | 'transfer'
  | 'salary_revision'
  | 'resignation'
  | 'termination'
  | 'rehire'

export type EmployeeTab = 'overview' | 'documents' | 'lifecycle' | 'attendance' | 'leave'

export type EmployeeFilterState = {
  department_id: string | null
  employment_type: Employee['employment_type'] | null
  employment_status: Employee['employment_status'] | null
  search: string
}
