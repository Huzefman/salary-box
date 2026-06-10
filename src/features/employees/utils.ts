import type { Employee } from '@/types'

export function getEmployeeFullName(employee: Pick<Employee, 'first_name' | 'last_name'>): string {
  return `${employee.first_name} ${employee.last_name}`
}

export function getEmploymentStatusLabel(status: Employee['employment_status']): string {
  const labels: Record<Employee['employment_status'], string> = {
    active: 'Active',
    inactive: 'Inactive',
    terminated: 'Terminated',
    future_joiner: 'Future Joiner',
  }
  return labels[status] ?? status
}
