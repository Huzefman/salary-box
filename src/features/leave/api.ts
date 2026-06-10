import { supabase } from '@/lib/supabase'
import type { LeaveApplication, LeaveBalance, LeaveType } from '@/types'

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function fetchMyLeaveBalances(
  employeeId: string,
  year: number
): Promise<LeaveBalance[]> {
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*, leave_type:leave_types(id, name, code)')
    .eq('employee_id', employeeId)
    .eq('year', year)
  if (error) throw error
  return data ?? []
}

export async function fetchMyLeaveApplications(
  employeeId: string
): Promise<LeaveApplication[]> {
  const { data, error } = await supabase
    .from('leave_applications')
    .select('*, leave_type:leave_types(id, name, code)')
    .eq('employee_id', employeeId)
    .order('applied_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchPendingLeaveApplications(): Promise<LeaveApplication[]> {
  const { data, error } = await supabase
    .from('leave_applications')
    .select('*, leave_type:leave_types(id, name, code), employee:employees(id, first_name, last_name, employee_code)')
    .eq('status', 'pending')
    .order('applied_at')
  if (error) throw error
  return data ?? []
}

export async function fetchLeaveApplication(id: string): Promise<LeaveApplication> {
  const { data, error } = await supabase
    .from('leave_applications')
    .select('*, leave_type:leave_types(*), employee:employees(id, first_name, last_name, employee_code)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as LeaveApplication
}
