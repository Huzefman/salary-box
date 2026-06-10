import type { Database } from './database.types'

// ─── Table row types ──────────────────────────────────────────────────────────
export type Employee = Database['public']['Tables']['employees']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type Designation = Database['public']['Tables']['designations']['Row']
export type AttendanceRecord = Database['public']['Tables']['attendance_records']['Row']
export type LeaveType = Database['public']['Tables']['leave_types']['Row']
export type LeaveBalance = Database['public']['Tables']['leave_balances']['Row']
export type LeaveApplication = Database['public']['Tables']['leave_applications']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AppConfig = Database['public']['Tables']['app_config']['Row']

// ─── Role ─────────────────────────────────────────────────────────────────────
export type Role = Employee['role']

// ─── Edge Function error shape (returned on non-2xx) ─────────────────────────
export type EdgeError = {
  code: string
  message: string
  details?: unknown
}

// ─── Edge Function response shapes ───────────────────────────────────────────
export type CheckInResponse = {
  attendance_record_id: string
  check_in_time: string
  is_late: boolean
  is_geo_flagged: boolean
}

export type CheckOutResponse = {
  attendance_record_id: string
  check_out_time: string
  total_hours: number
  overtime_hours: number
  is_geo_flagged: boolean
}

export type SubmitLeaveResponse = {
  application_id: string
  working_days_count: number
  status: LeaveApplication['status']
  escalated_to: string | null
}

export type CreateEmployeeResponse = {
  employee_id: string
  employee_code: string
  employment_status: Employee['employment_status']
}

// ─── Derived display types ────────────────────────────────────────────────────
export type EmployeeWithRelations = Employee & {
  department: Department | null
  designation: Designation | null
  reporting_manager: Pick<Employee, 'id' | 'first_name' | 'last_name'> | null
}

export type LeaveApplicationWithRelations = LeaveApplication & {
  leave_type: LeaveType
  employee: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'employee_code'>
}
