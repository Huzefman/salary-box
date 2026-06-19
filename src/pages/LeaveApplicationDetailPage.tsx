import { useParams } from 'react-router-dom'
import { useLeaveApplication } from '@/features/leave/hooks'
import { LeaveApplicationDetail } from '@/features/leave/components/LeaveApplicationDetail'
import { Skeleton } from '@/components/ui/skeleton'

export default function LeaveApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: application, isLoading } = useLeaveApplication(id ?? '')

  if (!id) return <p className="text-muted-foreground">No application ID provided</p>

  if (isLoading) return <Skeleton className="h-96" />

  if (!application) return <p className="text-muted-foreground">Leave application not found</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leave Application</h1>
      <LeaveApplicationDetail application={application} />
    </div>
  )
}
