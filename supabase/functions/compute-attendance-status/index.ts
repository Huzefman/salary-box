import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { resolveShift } from '../_shared/shift.ts'
import { isHoliday, isWeeklyOff } from '../_shared/holiday.ts'
import {
  computeStatus,
  type AttendanceRecordForCompute,
} from '../_shared/attendance.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    // Fetch all active employees (not just those with existing records)
    const { data: employees } = await supabase
      .from('employees')
      .select('id')
      .eq('is_active', true)

    if (!employees || employees.length === 0) {
      return ok({ processed: 0 })
    }

    let processed = 0
    for (const emp of employees) {
      let shift
      try {
        shift = await resolveShift(emp.id, yesterday)
      } catch {
        continue
      }

      const holidayFlag = await isHoliday(emp.id, yesterday)
      const woffFlag = isWeeklyOff(shift, yesterday)

      // Skip non-working days (no record needed)
      if (holidayFlag || woffFlag) continue

      // Check for existing attendance record
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('date', yesterday)
        .maybeSingle()

      if (existing) {
        // Update existing record with computed status
        const rec: AttendanceRecordForCompute = {
          id: existing.id,
          employee_id: existing.employee_id,
          date: existing.date,
          shift_id: existing.shift_id,
          check_in_time: existing.check_in_time,
          check_out_time: existing.check_out_time,
          is_wfh: existing.is_wfh,
          status: existing.status,
          total_hours: existing.total_hours,
          is_late: existing.is_late,
          is_manually_entered: existing.is_manually_entered,
        }

        const result = computeStatus(rec, shift, holidayFlag, woffFlag)

        const { error: updateError } = await supabase
          .from('attendance_records')
          .update({
            total_hours: result.total_hours,
            is_late: result.is_late,
            is_geo_flagged: existing.is_geo_flagged,
            status: result.status,
          })
          .eq('id', existing.id)

        if (!updateError) processed++
      } else {
        // No record → create absent
        const { error: insertError } = await supabase
          .from('attendance_records')
          .insert({
            employee_id: emp.id,
            date: yesterday,
            shift_id: shift.id,
            status: 'absent',
            total_hours: null,
            is_late: false,
            is_wfh: false,
            is_manually_entered: false,
          })

        if (!insertError) processed++
      }
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
