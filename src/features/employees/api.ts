import { supabase } from '@/lib/supabase'
import type {
  Employee,
  EmployeeWithRelations,
  EmployeeDocument,
  EmployeeLifecycleEventWithRelations,
  EmployeeBankDetail,
  EmployeeOnboardingProgress,
  OnboardingChecklistTemplate,
  LeaveBalanceWithType,
  AttendanceRecord,
  AuditLog,
} from '@/types'

async function fetchManagerName(emp: EmployeeWithRelations): Promise<void> {
  if (emp.reporting_manager_id) {
    const { data } = await supabase
      .rpc('get_employee_name', { p_id: emp.reporting_manager_id })
      .maybeSingle()
    emp.reporting_manager = data ?? null
  } else {
    emp.reporting_manager = null
  }
}

export async function fetchEmployees(): Promise<EmployeeWithRelations[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments!department_id(id, name),
      designation:designations!designation_id(id, name)
    `)
    .eq('is_active', true)
    .order('first_name')
  if (error) throw error
  return data as unknown as EmployeeWithRelations[]
}

export async function fetchEmployee(id: string): Promise<EmployeeWithRelations | null> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments!department_id(id, name),
      designation:designations!designation_id(id, name)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const emp = data as unknown as EmployeeWithRelations
  await fetchManagerName(emp)
  return emp
}

export async function fetchDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function fetchDesignations() {
  const { data, error } = await supabase
    .from('designations')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function fetchActiveManagers(): Promise<Pick<Employee, 'id' | 'first_name' | 'last_name'>[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .eq('is_active', true)
    .in('role', ['owner', 'hr'])
    .order('first_name')
  if (error) throw error
  return data ?? []
}

export async function fetchEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
  const { data, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchEmployeeLifecycleEvents(employeeId: string): Promise<EmployeeLifecycleEventWithRelations[]> {
  const { data, error } = await supabase
    .from('employee_lifecycle_events')
    .select(`
      *,
      performer:employees!performed_by(id, first_name, last_name),
      previous_department:departments!previous_department_id(id, name),
      new_department:departments!new_department_id(id, name),
      previous_designation:designations!previous_designation_id(id, name),
      new_designation:designations!new_designation_id(id, name)
    `)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as EmployeeLifecycleEventWithRelations[]
}

export async function fetchEmployeeBankDetails(employeeId: string): Promise<EmployeeBankDetail | null> {
  const { data, error } = await supabase
    .from('employee_bank_details')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchEmployeeOnboardingProgress(employeeId: string): Promise<(EmployeeOnboardingProgress & { template: OnboardingChecklistTemplate | null })[]> {
  const { data, error } = await supabase
    .from('employee_onboarding_progress')
    .select(`
      *,
      template:onboarding_checklist_templates(*)
    `)
    .eq('employee_id', employeeId)
    .order('checklist_item_id')
  if (error) throw error
  return data as unknown as (EmployeeOnboardingProgress & { template: OnboardingChecklistTemplate | null })[]
}

export async function fetchEmployeeAttendanceCurrentMonth(employeeId: string): Promise<AttendanceRecord[]> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const startDate = `${year}-${month}-01`

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', `${year}-${month}-31`)
    .order('date')
  if (error) throw error
  return data ?? []
}

export async function fetchEmployeeActivity(employeeId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      actor:employees!actor_id(id, first_name, last_name)
    `)
    .eq('record_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data as unknown as (AuditLog & { actor: { id: string; first_name: string; last_name: string } | null })[]
}

export async function fetchEmployeeLeaveBalancesWithType(employeeId: string): Promise<LeaveBalanceWithType[]> {
  const year = new Date().getFullYear()
  const { data, error } = await supabase
    .from('leave_balances')
    .select(`
      *,
      leave_type:leave_types(*)
    `)
    .eq('employee_id', employeeId)
    .eq('year', year)
  if (error) throw error
  return data as unknown as LeaveBalanceWithType[]
}
