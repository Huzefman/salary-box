import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { resolveShift } from '../_shared/shift.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date().toISOString().slice(0, 10)

    const { data: bufferConfig } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'auto_checkout_buffer_minutes')
      .maybeSingle()

    const bufferMinutes = parseInt(bufferConfig?.value || '30', 10)

    const { data: incomplete } = await supabase
      .from('attendance_records')
      .select('id, employee_id')
      .eq('date', today)
      .not('check_in_time', 'is', null)
      .is('check_out_time', null)

    if (!incomplete || incomplete.length === 0) {
      return ok({ processed: 0 })
    }

    let processed = 0
    for (const record of incomplete) {
      try {
        const shift = await resolveShift(record.employee_id, today)
        const [eh, em] = shift.end_time.split(':').map(Number)
        let totalMinutes = eh * 60 + em + bufferMinutes
        const autoH = Math.floor(totalMinutes / 60)
        const autoM = totalMinutes % 60
        const autoCheckoutStr = `${String(autoH).padStart(2, '0')}:${String(autoM).padStart(2, '0')}:00`
        const autoCheckoutIso = `${today}T${autoCheckoutStr}+05:30`

        const { error: updateError } = await supabase
          .from('attendance_records')
          .update({
            check_out_time: autoCheckoutIso,
            status: 'absent',
            total_hours: null,
          })
          .eq('id', record.id)

        if (!updateError) {
          processed++
          await createNotification({
            recipientId: record.employee_id,
            title: 'Attendance Incomplete',
            body: `Your attendance for ${today} was incomplete. Please submit a regularization request.`,
            type: 'attendance_incomplete',
            referenceId: record.id,
            referenceTable: 'attendance_records',
          })
        }
      } catch {
        continue
      }
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
