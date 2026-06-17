import { useRole } from '@/hooks/useRole'

export default function ReportsAttendancePage() {
  const { role } = useRole()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Attendance Report</h1>
      <p className="text-muted-foreground">
        {role === 'employee'
          ? 'Your monthly attendance summary will appear here.'
          : 'Team attendance reports will appear here. Filters by month, year, department, and employee.'}
      </p>
    </div>
  )
}
