import type { AttendanceStatus } from './types'

export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<NonNullable<AttendanceStatus>, string> = {
    present: 'Present',
    absent: 'Absent',
    half_day: 'Half Day',
    on_leave: 'On Leave',
    holiday: 'Holiday',
    work_from_home: 'WFH',
    weekly_off: 'Weekly Off',
    incomplete: 'Incomplete',
  }
  return status ? (labels[status] ?? status) : '—'
}

export function formatHours(hours: number | null): string {
  if (hours === null) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
