import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRegularizationHistory, useAppConfig } from '@/features/attendance/hooks'
import { useSubmitRegularization } from '@/features/attendance/mutations'
import { submitRegularizationSchema, type SubmitRegularizationForm } from '@/features/attendance/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'work_from_home', label: 'Work From Home' },
] as const

export default function RegularizationPage() {
  const { data: requests, isLoading: histLoading, refetch } = useRegularizationHistory()
  const { data: windowDaysStr } = useAppConfig('regularization_window_days')
  const windowDays = parseInt(windowDaysStr ?? '7', 10)
  const submitReg = useSubmitRegularization()
  const [open, setOpen] = useState(false)

  const form = useForm<SubmitRegularizationForm>({
    resolver: zodResolver(submitRegularizationSchema),
    defaultValues: {
      attendance_record_id: '',
      requested_status: 'present',
      reason: '',
    },
  })

  const onSubmit = async (values: SubmitRegularizationForm) => {
    try {
      await submitReg.mutateAsync(values)
      toast.success('Regularization request submitted')
      form.reset()
      setOpen(false)
      refetch()
    } catch (e: unknown) {
      const err = e as { message?: string }
      toast.error(err?.message ?? 'Failed to submit request')
    }
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return variants[status] ?? 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Attendance Regularization</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Regularization Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Attendance Record ID</Label>
                <Input {...form.register('attendance_record_id')} placeholder="Paste attendance record ID" />
                {form.formState.errors.attendance_record_id && (
                  <p className="text-xs text-red-500">{form.formState.errors.attendance_record_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Requested Status</Label>
                <Select
                  value={form.watch('requested_status')}
                  onValueChange={(v) => form.setValue('requested_status', v as SubmitRegularizationForm['requested_status'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Requested Check-in (optional)</Label>
                <Input type="datetime-local" {...form.register('requested_check_in')} />
              </div>
              <div className="space-y-2">
                <Label>Requested Check-out (optional)</Label>
                <Input type="datetime-local" {...form.register('requested_check_out')} />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea {...form.register('reason')} placeholder="Why are you requesting this change?" />
                {form.formState.errors.reason && (
                  <p className="text-xs text-red-500">{form.formState.errors.reason.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitReg.isPending}>
                {submitReg.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Request
              </Button>
              <p className="text-xs text-muted-foreground">
                You can request regularization for the past {windowDays} calendar days only.
              </p>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {histLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Request History</CardTitle></CardHeader>
          <CardContent>
            {!requests || requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No regularization requests yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium">{req.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {req.requested_status}
                        {req.requested_check_in && ` · Check-in: ${new Date(req.requested_check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        {req.requested_check_out && ` · Check-out: ${new Date(req.requested_check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString('en-IN')}
                        {req.reviewer_comment && ` · Review: ${req.reviewer_comment}`}
                      </p>
                    </div>
                    <Badge className={statusBadge(req.status)}>{req.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
