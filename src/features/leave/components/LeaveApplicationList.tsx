import { useNavigate } from 'react-router-dom'
import type { LeaveApplicationWithRelations } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getLeaveStatusLabel } from '../utils'

type Props = {
  applications: LeaveApplicationWithRelations[]
  showEmployee?: boolean
}

export function LeaveApplicationList({ applications, showEmployee }: Props) {
  const navigate = useNavigate()

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No leave applications found
        </CardContent>
      </Card>
    )
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    cancelled: 'outline',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leave Applications</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(`/leave/applications/${app.id}`)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {showEmployee && app.employee && (
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {app.employee.first_name} {app.employee.last_name} ({app.employee.employee_code})
                    </p>
                  )}
                  <p className="text-sm font-medium truncate">
                    {app.from_date} — {app.to_date}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {app.leave_type.name} &middot; {app.reason}
                    {app.attachment_path && ' 📎'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={statusVariant[app.status] ?? 'secondary'}>
                    {getLeaveStatusLabel(app.status)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(app.applied_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
