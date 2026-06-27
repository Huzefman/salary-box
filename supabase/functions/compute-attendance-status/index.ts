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

    const { data: records } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('date', yesterday)

    if (!records || records.length === 0) {
      return ok({ processed: 0 })
    }

    let processed = 0
    for (const record of records) {
      const rec: AttendanceRecordForCompute = {
        id: record.id,
        employee_id: record.employee_id,
        date: record.date,
        shift_id: record.shift_id,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        is_wfh: record.is_wfh,
        status: record.status,
        total_hours: record.total_hours,
        is_late: record.is_late,
        is_manually_entered: record.is_manually_entered,
      }

      let shift
      try {
        shift = await resolveShift(record.employee_id, yesterday)
      } catch {
        continue
      }

      const holidayFlag = await isHoliday(record.employee_id, yesterday)
      const woffFlag = isWeeklyOff(shift, yesterday)

      const result = computeStatus(rec, shift, holidayFlag, woffFlag)

      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({
          total_hours: result.total_hours,
          is_late: result.is_late,
          is_geo_flagged: record.is_geo_flagged,
          status: result.status,
        })
        .eq('id', record.id)

      if (!updateError) processed++
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
