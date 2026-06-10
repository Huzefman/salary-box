import { supabase } from '@/lib/supabase'
import type { Employee, EmployeeWithRelations } from '@/types'

export async function fetchEmployees(): Promise<EmployeeWithRelations[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments(id, name),
      designation:designations(id, name),
      reporting_manager:employees!reporting_manager_id(id, first_name, last_name)
    `)
    .eq('is_active', true)
    .order('first_name')
  if (error) throw error
  return data as unknown as EmployeeWithRelations[]
}

export async function fetchEmployee(id: string): Promise<EmployeeWithRelations> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments(id, name),
      designation:designations(id, name),
      reporting_manager:employees!reporting_manager_id(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as EmployeeWithRelations
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
