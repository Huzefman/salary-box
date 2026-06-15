import type { Employee } from '@/types'

export type EmployeeStatusBadgeVariant = 'active' | 'inactive' | 'terminated' | 'future_joiner'

export type LifecycleEventType =
  | 'promotion'
  | 'transfer'
  | 'salary_revision'
  | 'resignation'
  | 'termination'
  | 'rehire'

export type EmployeeTab = 'overview' | 'documents' | 'bank_details' | 'lifecycle' | 'attendance' | 'leave' | 'onboarding'

export type EmployeeFilterState = {
  department_id: string | null
  employment_type: Employee['employment_type'] | null
  employment_status: Employee['employment_status'] | null
  search: string
}

export type LifecycleEventForm = {
  employee_id: string
  event_type: LifecycleEventType
  effective_date: string
  previous_department_id?: string | null
  new_department_id?: string | null
  previous_designation_id?: string | null
  new_designation_id?: string | null
  previous_salary?: number | null
  new_salary?: number | null
  reason?: string | null
  document_path?: string | null
}

export type UploadDocumentForm = {
  employee_id: string
  document_type: string
  file: File
  force?: boolean
  override_reason?: string
}
