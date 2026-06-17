import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getEmployeeFullName, getEmploymentStatusLabel } from '@/features/employees/utils'
import type { EmployeeWithRelations } from '@/types'

type Props = { employee: EmployeeWithRelations }

function statusVariant(status: string) {
  switch (status) {
    case 'active': return 'default'
    case 'on_probation': return 'secondary'
    case 'future_joiner': return 'outline'
    case 'terminated':
    case 'resigned': return 'destructive'
    default: return 'secondary'
  }
}

export function EmployeeOverviewTab({ employee }: Props) {
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()
  const { isOwner, isHR } = useRole()
  const currentEmployee = useAuthStore((s) => s.employee)
  const isOwnProfile = currentEmployee?.id === employee.id
  const canEdit = isOwner || isHR || isOwnProfile

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={employee.photo_url ?? undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{getEmployeeFullName(employee)}</CardTitle>
                <p className="text-sm text-muted-foreground">{employee.employee_code}</p>
                <div className="mt-1 flex gap-2">
                  <Badge variant={statusVariant(employee.employment_status)}>
                    {getEmploymentStatusLabel(employee.employment_status)}
                  </Badge>
                  <Badge variant="outline">{employee.role}</Badge>
                </div>
              </div>
            </div>
            {canEdit && (
              <Link to={`/employees/${employee.id}/edit`}>
                <Button size="sm" variant="outline"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
              </Link>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{employee.email}</span></div>
            {employee.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{employee.phone}</span></div>}
            {employee.personal_email && <div className="flex justify-between"><span className="text-muted-foreground">Personal Email</span><span>{employee.personal_email}</span></div>}
            {employee.date_of_birth && <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{employee.date_of_birth}</span></div>}
            {employee.gender && <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="capitalize">{employee.gender}</span></div>}
            {employee.address_line1 && (
              <div>
                <span className="text-muted-foreground">Address</span>
                <p>{employee.address_line1}{employee.city ? `, ${employee.city}` : ''}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span>{employee.department?.name ?? '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Designation</span>
              <span>{employee.designation?.name ?? '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reporting Manager</span>
              <span>{employee.reporting_manager ? `${employee.reporting_manager.first_name} ${employee.reporting_manager.last_name}` : '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize">{employee.employment_type.replace('_', ' ')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Join Date</span>
              <span>{employee.join_date}</span>
            </div>
            {employee.probation_end_date && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Probation End</span>
                  <span>{employee.probation_end_date}</span>
                </div>
              </>
            )}
            {employee.exit_date && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exit Date</span>
                  <span>{employee.exit_date}</span>
                </div>
              </>
            )}
            {employee.current_salary != null && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Salary</span>
                  <span>₹{employee.current_salary.toLocaleString()}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
