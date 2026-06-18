import type { ShiftInfo } from './shift.ts'

export function computeTotalHours(
  checkIn: string,
  checkOut: string,
  breakMinutes: number,
  isNightShift: boolean
): number {
  const inTime = new Date(checkIn).getTime()
  let outTime = new Date(checkOut).getTime()

  if (isNightShift && outTime < inTime) {
    outTime += 24 * 60 * 60 * 1000
  }

  const diffMs = outTime - inTime
  const diffHours = diffMs / (1000 * 60 * 60)
  const hours = Math.max(0, diffHours - breakMinutes / 60)
  return Math.round(hours * 100) / 100
}

export function computeOvertime(totalHours: number, shift: ShiftInfo): number {
  const shiftStart = parseTime(shift.start_time)
  const shiftEnd = parseTime(shift.end_time)
  let shiftWorkingHours = shiftEnd - shiftStart
  if (shiftWorkingHours < 0) shiftWorkingHours += 24
  const breakHours = (shift.total_hours - (shiftEnd - shiftStart)) > 0 ? 0 : 0
  // shift.total_hours in ShiftInfo is the precomputed shift working hours
  const workingHours = shiftWorkingHours - (60 / 60)
  // Actually, ShiftInfo.total_hours is the shift's total_hours from schema perspective
  // Let's use the actual shift hours from shift metadata
  const shiftHours = shift.total_hours > 0 ? shift.total_hours : shiftWorkingHours
  return Math.max(0, Math.round((totalHours - shiftHours) * 100) / 100)
}

export function computeOvertimeFromShift(
  totalHours: number,
  shiftStart: string,
  shiftEnd: string,
  breakMinutes: number
): number {
  const start = parseTime(shiftStart)
  let end = parseTime(shiftEnd)
  if (end < start) end += 24
  const shiftHours = Math.max(0, end - start - breakMinutes / 60)
  return Math.max(0, Math.round((totalHours - shiftHours) * 100) / 100)
}

export function computeIsLate(
  checkInTime: string,
  shiftStart: string,
  gracePeriodMinutes: number
): boolean {
  const checkIn = new Date(checkInTime)
  const startToday = new Date(checkInTime)
  const [sh, sm] = shiftStart.split(':').map(Number)
  startToday.setHours(sh, sm, 0, 0)
  const graceMs = gracePeriodMinutes * 60 * 1000
  return checkIn.getTime() > startToday.getTime() + graceMs
}

export type AttendanceRecordForCompute = {
  id?: string
  employee_id: string
  date: string
  shift_id?: string | null
  check_in_time?: string | null
  check_out_time?: string | null
  is_wfh: boolean
  status: string
  total_hours?: number | null
  overtime_hours?: number | null
  is_late: boolean
  is_manually_entered: boolean
}

export function computeStatus(
  record: AttendanceRecordForCompute,
  shift: ShiftInfo,
  holidayFlag: boolean,
  weeklyOffFlag: boolean
): {
  status: string
  total_hours: number | null
  overtime_hours: number | null
  is_late: boolean
} {
  if (record.status === 'on_leave') {
    return {
      status: 'on_leave',
      total_hours: record.total_hours,
      overtime_hours: record.overtime_hours,
      is_late: record.is_late,
    }
  }

  if (holidayFlag) {
    return { status: 'holiday', total_hours: null, overtime_hours: null, is_late: false }
  }

  if (weeklyOffFlag) {
    return { status: 'weekly_off', total_hours: null, overtime_hours: null, is_late: false }
  }

  if (record.is_wfh && !record.check_in_time) {
    return { status: 'work_from_home', total_hours: null, overtime_hours: null, is_late: false }
  }

  if (!record.check_in_time) {
    return { status: 'absent', total_hours: null, overtime_hours: null, is_late: false }
  }

  if (record.check_in_time && !record.check_out_time) {
    return {
      status: 'incomplete',
      total_hours: record.total_hours,
      overtime_hours: record.overtime_hours,
      is_late: record.is_late,
    }
  }

  const totalHours = record.total_hours ?? computeTotalHours(
    record.check_in_time!,
    record.check_out_time!,
    0,
    false
  )
  const shiftHours = shift.total_hours || (() => {
    const start = parseTime(shift.start_time)
    let end = parseTime(shift.end_time)
    if (end < start) end += 24
    return end - start
  })()

  if (totalHours < shiftHours / 2) {
    return { status: 'half_day', total_hours: totalHours, overtime_hours: 0, is_late: false }
  }

  if (record.is_wfh && totalHours >= shiftHours / 2) {
    return { status: 'work_from_home', total_hours: totalHours, overtime_hours: 0, is_late: record.is_late }
  }

  const overtime = computeOvertimeFromShift(totalHours, shift.start_time, shift.end_time, 0)

  return {
    status: 'present',
    total_hours: totalHours,
    overtime_hours: overtime,
    is_late: record.is_late,
  }
}

export function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h + m / 60
}
