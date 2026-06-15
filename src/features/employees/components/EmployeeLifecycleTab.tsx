import { useEmployeeLifecycleEvents } from '@/features/employees/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

type Props = { employeeId: string }

const eventIcons: Record<string, string> = {
  promotion: '↑',
  transfer: '→',
  salary_revision: '₹',
  resignation: '←',
  termination: '✕',
  rehire: '↺',
}

const eventLabels: Record<string, string> = {
  promotion: 'Promotion',
  transfer: 'Transfer',
  salary_revision: 'Salary Revision',
  resignation: 'Resignation',
  termination: 'Termination',
  rehire: 'Rehire',
}

export function EmployeeLifecycleTab({ employeeId }: Props) {
  const { data: events, isLoading } = useEmployeeLifecycleEvents(employeeId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Lifecycle History</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!events?.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Lifecycle History</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No lifecycle events recorded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Lifecycle History</CardTitle></CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {events.map((event, idx) => (
            <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-sm">
                  {eventIcons[event.event_type] ?? '•'}
                </div>
                {idx < events.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{eventLabels[event.event_type] ?? event.event_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.effective_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5 text-sm">
                  {event.previous_designation && event.new_designation && (
                    <p className="text-muted-foreground">
                      {event.previous_designation.name} → {event.new_designation.name}
                    </p>
                  )}
                  {event.previous_department && event.new_department && (
                    <p className="text-muted-foreground">
                      {event.previous_department.name} → {event.new_department.name}
                    </p>
                  )}
                  {event.previous_salary != null && event.new_salary != null && (
                    <p className="text-muted-foreground">
                      ₹{event.previous_salary.toLocaleString()} → ₹{event.new_salary.toLocaleString()}
                    </p>
                  )}
                  {event.reason && (
                    <p className="text-xs italic text-muted-foreground">{event.reason}</p>
                  )}
                  {event.performer && (
                    <p className="text-xs text-muted-foreground">
                      by {event.performer.first_name} {event.performer.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
