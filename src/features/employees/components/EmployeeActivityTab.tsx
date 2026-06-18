import { useEmployeeActivity } from '@/features/employees/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type Props = { employeeId: string }

const actionIcons: Record<string, string> = {
  insert: '+',
  update: '~',
  delete: '✕',
  deactivate: '↓',
  reactivate: '↑',
}

const actionLabels: Record<string, string> = {
  insert: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  deactivate: 'Deactivated',
  reactivate: 'Reactivated',
}

const tableLabels: Record<string, string> = {
  employees: 'Profile',
  employee_documents: 'Document',
  employee_bank_details: 'Bank Details',
  employee_lifecycle_events: 'Lifecycle Event',
}

export function EmployeeActivityTab({ employeeId }: Props) {
  const { data: activities, isLoading } = useEmployeeActivity(employeeId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!activities?.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {activities.map((entry, idx) => (
            <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-background text-xs font-mono">
                  {actionIcons[entry.action] ?? '•'}
                </div>
                {idx < activities.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {actionLabels[entry.action] ?? entry.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {tableLabels[entry.table_name] ?? entry.table_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                {entry.action === 'update' && entry.old_data && entry.new_data && (
                  <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                    {Object.keys(entry.new_data as Record<string, unknown>).map((key) => {
                      const oldVal = (entry.old_data as Record<string, unknown>)?.[key]
                      const newVal = (entry.new_data as Record<string, unknown>)?.[key]
                      if (oldVal === newVal) return null
                      if (key === 'updated_at') return null
                      return (
                        <p key={key}>
                          <span className="font-medium">{key.replace(/_/g, ' ')}: </span>
                          <span className="line-through">{String(oldVal ?? '—')}</span>
                          {' → '}
                          <span>{String(newVal ?? '—')}</span>
                        </p>
                      )
                    })}
                  </div>
                )}

                {entry.actor && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    by {entry.actor.first_name} {entry.actor.last_name}
                    {entry.actor_role && ` (${entry.actor_role})`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
