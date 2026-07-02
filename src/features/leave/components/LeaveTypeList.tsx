import { useState } from 'react'
import { useLeaveTypes } from '../hooks'
import { useRole } from '@/hooks/useRole'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { LeaveTypeForm } from './LeaveTypeForm'
import type { LeaveType } from '@/types'

export function LeaveTypeList() {
  const { data: leaveTypes, isLoading } = useLeaveTypes()
  const { isAdminOrHR } = useRole()
  const [editing, setEditing] = useState<LeaveType | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!leaveTypes || leaveTypes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No leave types configured
        </CardContent>
      </Card>
    )
  }

  const handleRowClick = (lt: LeaveType) => {
    if (!isAdminOrHR) return
    setEditing(lt)
    setDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Types</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Accrual Type</TableHead>
                <TableHead>Accrual Days</TableHead>
                <TableHead>Max Carry Forward</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((lt) => (
                <TableRow
                  key={lt.id}
                  className={isAdminOrHR ? 'cursor-pointer' : ''}
                  onClick={() => handleRowClick(lt)}
                >
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell className="font-mono text-xs">{lt.code}</TableCell>
                  <TableCell className="capitalize">{lt.accrual_type.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{lt.accrual_days ?? '—'}</TableCell>
                  <TableCell>{lt.max_carry_forward_days}</TableCell>
                  <TableCell>
                    <Badge variant={lt.is_active ? 'default' : 'secondary'}>
                      {lt.is_active ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeaveTypeForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        leaveType={editing}
      />
    </>
  )
}
