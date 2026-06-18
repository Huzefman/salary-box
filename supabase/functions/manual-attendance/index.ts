import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { resolveShift } from '../_shared/shift.ts'
import { isHoliday, isWeeklyOff } from '../_shared/holiday.ts'
import {
  computeTotalHours,
  computeOvertimeFromShift,
  computeIsLate,
  computeStatus,
  type AttendanceRecordForCompute,
} from '../_shared/attendance.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    const body = await req.json()

    const { employee_id, date, check_in_time, check_out_time, is_wfh, reason } = body

    if (!employee_id || !date || !reason) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'employee_id, date, and reason are required.',
        status: 400,
      }
    }

    const supabase = getServiceClient()
    const shift = await resolveShift(employee_id, date)

    let totalHours: number | null = null
    let overtimeHours: number | null = null
    let isLate = false

    if (check_in_time && check_out_time) {
      totalHours = computeTotalHours(
        check_in_time,
        check_out_time,
        shift.break_minutes,
        shift.is_night_shift
      )
      overtimeHours = computeOvertimeFromShift(
        totalHours,
        shift.start_time,
        shift.end_time,
        shift.break_minutes
      )
      isLate = computeIsLate(check_in_time, shift.start_time, shift.grace_period_minutes)
    }

    const holidayFlag = await isHoliday(employee_id, date)
    const woffFlag = isWeeklyOff(shift, date)

    const rec: AttendanceRecordForCompute = {
      employee_id,
      date,
      check_in_time: check_in_time || null,
      check_out_time: check_out_time || null,
      is_wfh: is_wfh || false,
      status: 'absent',
      total_hours: totalHours,
      overtime_hours: overtimeHours,
      is_late: isLate,
      is_manually_entered: true,
    }

    const result = computeStatus(rec, shift, holidayFlag, woffFlag)

    const payload: Record<string, unknown> = {
      employee_id,
      date,
      shift_id: shift.id,
      is_manually_entered: true,
      manual_entry_reason: reason,
      manual_entry_by: actor.actorId,
    }

    if (check_in_time) payload.check_in_time = check_in_time
    if (check_out_time) payload.check_out_time = check_out_time
    if (is_wfh) payload.is_wfh = true
    payload.status = result.status
    payload.total_hours = result.total_hours
    payload.overtime_hours = result.overtime_hours
    payload.is_late = result.is_late

    const { data: record, error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'employee_id, date', ignoreDuplicates: false })
      .select('id, status, total_hours')
      .single()

    if (error) throw error

    return ok({
      attendance_record_id: record.id,
      status: record.status,
      total_hours: record.total_hours,
    })
  } catch (e) {
    return handleError(e)
  }
})
