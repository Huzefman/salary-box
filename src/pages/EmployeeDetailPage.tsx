import { useParams } from 'react-router-dom'
import { EmployeeDetailTabs } from '@/features/employees/components/EmployeeDetailTabs'

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return (
    <div className="space-y-6">
      <EmployeeDetailTabs employeeId={id} />
    </div>
  )
}
