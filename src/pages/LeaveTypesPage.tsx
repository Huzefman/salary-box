import { LeaveTypeList } from '@/features/leave/components/LeaveTypeList'
import { LeaveTypeForm } from '@/features/leave/components/LeaveTypeForm'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function LeaveTypesPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leave Types</h1>
        <Button onClick={() => setOpen(true)}>Add Leave Type</Button>
      </div>
      <LeaveTypeList />
      <LeaveTypeForm open={open} onOpenChange={setOpen} />
    </div>
  )
}
