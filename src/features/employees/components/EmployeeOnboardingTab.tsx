import { useEmployeeOnboardingProgress } from '@/features/employees/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Circle } from 'lucide-react'

type Props = { employeeId: string }

export function EmployeeOnboardingTab({ employeeId }: Props) {
  const { data: items, isLoading } = useEmployeeOnboardingProgress(employeeId)
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Onboarding Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!items?.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Onboarding Checklist</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No onboarding checklist items configured</p>
        </CardContent>
      </Card>
    )
  }

  const completed = items.filter((i) => i.is_completed).length
  const total = items.length
  const pct = Math.round((completed / total) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Onboarding Checklist</CardTitle>
          <Badge variant="outline">{completed}/{total} done</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={pct} className="h-2" />

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {item.is_completed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.is_completed ? 'text-muted-foreground line-through' : ''}`}>
                  {item.template?.item_name ?? 'Unknown item'}
                </p>
                {item.template?.description && (
                  <p className="text-xs text-muted-foreground">{item.template.description}</p>
                )}
              </div>
              {item.template?.is_required && (
                <Badge variant="secondary" className="shrink-0">Required</Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
