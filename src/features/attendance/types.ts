import type { AttendanceRecord } from '@/types'

export type AttendanceStatus = AttendanceRecord['status']

export type AttendanceStatusConfig = {
  label: string
  className: string
}
