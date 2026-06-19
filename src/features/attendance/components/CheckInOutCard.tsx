import { useTodayAttendance } from '../hooks'
import { useCheckIn, useCheckOut, useLogWFH } from '../mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, LogOut, Home } from 'lucide-react'
import { toast } from 'sonner'
import { formatHours, getCurrentPosition } from '../utils'

export function CheckInOutCard() {
  const { data: today, isLoading, refetch } = useTodayAttendance()
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const logWFH = useLogWFH()

  const handleCheckIn = async () => {
    try {
      const coords = await getCurrentPosition()
      const result = await checkIn.mutateAsync(coords ?? {})
      toast.success(result.is_late ? 'Checked in — late' : 'Checked in successfully')
      refetch()
    } catch (e: unknown) {
      const err = e as { message?: string }
      toast.error(err?.message ?? 'Check-in failed')
    }
  }

  const handleCheckOut = async () => {
    try {
      const coords = await getCurrentPosition()
      const result = await checkOut.mutateAsync(coords ?? {})
      toast.success(`Checked out. Total: ${formatHours(result.total_hours)}`)
      refetch()
    } catch (e: unknown) {
      const err = e as { message?: string }
      toast.error(err?.message ?? 'Check-out failed')
    }
  }

  const handleLogWFH = async () => {
    try {
      await logWFH.mutateAsync()
      toast.success('WFH logged for today')
      refetch()
    } catch (e: unknown) {
      const err = e as { message?: string }
      toast.error(err?.message ?? 'Failed to log WFH')
    }
  }

  const checkedIn = !!today?.check_in_time
  const checkedOut = !!today?.check_out_time
  const isWFH = today?.is_wfh ?? false

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Today</CardTitle></CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Today</span>
          {checkedIn && today?.check_in_time && (
            <span className="text-sm font-normal text-muted-foreground">
              {new Date(today.check_in_time).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {checkedOut && today?.check_out_time && ` — ${new Date(today.check_out_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
              {!checkedOut && ' — In progress'}
              {today.total_hours != null && ` (${formatHours(today.total_hours)})`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Button
          size="lg"
          disabled={checkedIn || checkIn.isPending || isWFH}
          onClick={handleCheckIn}
        >
          {checkIn.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
          Check In
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={!checkedIn || checkedOut || checkOut.isPending}
          onClick={handleCheckOut}
        >
          {checkOut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          Check Out
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={checkedIn || isWFH || logWFH.isPending}
          onClick={handleLogWFH}
        >
          {logWFH.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Home className="mr-2 h-4 w-4" />}
          {isWFH ? 'WFH Logged' : 'Log WFH'}
        </Button>
      </CardContent>
    </Card>
  )
}
