import { useAuthStore } from '@/hooks/useAuth'
import { EmployeeDetailTabs } from '@/features/employees/components/EmployeeDetailTabs'

export default function EmployeeSelfProfilePage() {
  const employee = useAuthStore((s) => s.employee)

  if (!employee) return null

  return (
    <div className="space-y-6">
      <EmployeeDetailTabs employeeId={employee.id} />
    </div>
  )
}
