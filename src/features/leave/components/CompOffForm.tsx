import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { submitCompOffSchema, type SubmitCompOffForm } from '../schemas'
import { useSubmitCompOff } from '../mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function CompOffForm() {
  const submitCompOff = useSubmitCompOff()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitCompOffForm>({
    resolver: zodResolver(submitCompOffSchema),
    defaultValues: {
      hours_worked: 8,
    },
  })

  const onSubmit = async (data: SubmitCompOffForm) => {
    try {
      await submitCompOff.mutateAsync(data)
      toast.success('Comp-off request submitted')
      reset({ hours_worked: 8 })
    } catch (e: unknown) {
      const err = e as { message?: string }
      toast.error(err?.message ?? 'Failed to submit comp-off request')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request Comp Off</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="worked_date">Worked Date</Label>
            <Input id="worked_date" type="date" {...register('worked_date')} />
            {errors.worked_date && (
              <p className="text-sm text-destructive">{errors.worked_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours_worked">Hours Worked</Label>
            <Input
              id="hours_worked"
              type="number"
              min={1}
              max={24}
              {...register('hours_worked', { valueAsNumber: true })}
            />
            {errors.hours_worked && (
              <p className="text-sm text-destructive">{errors.hours_worked.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={4}
              placeholder="Why did you work on this day?"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitCompOff.isPending}>
            {submitCompOff.isPending ? 'Submitting...' : 'Submit Comp Off'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
