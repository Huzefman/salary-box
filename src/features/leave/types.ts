import type { LeaveBalance, LeaveType } from '@/types'

export type LeaveStatusConfig = {
  label: string
  className: string
}

export type LeaveBalanceDisplay = LeaveBalance & {
  leave_type: LeaveType
  available: number
}
