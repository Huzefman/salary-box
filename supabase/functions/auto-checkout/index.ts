import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date().toISOString().slice(0, 10)

    const { data: config } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'auto_checkout_time')
      .maybeSingle()

    const autoCheckoutTime = config?.value || '23:59:00'

    const { data: incomplete } = await supabase
      .from('attendance_records')
      .select('id, employee_id')
      .eq('date', today)
      .not('check_in_time', 'is', null)
      .is('check_out_time', null)

    if (!incomplete || incomplete.length === 0) {
      return ok({ processed: 0 })
    }

    const autoCheckoutIso = `${today}T${autoCheckoutTime}+05:30`

    const ids = incomplete.map((r) => r.id)
    const { error: updateError } = await supabase
      .from('attendance_records')
      .update({ check_out_time: autoCheckoutIso, status: 'incomplete' })
      .in('id', ids)

    if (updateError) throw updateError

    for (const record of incomplete) {
      await createNotification({
        recipientId: record.employee_id,
        title: 'Attendance Incomplete',
        body: `Your attendance for ${today} was incomplete. Please submit a regularization request.`,
        type: 'attendance_incomplete',
        referenceId: record.id,
        referenceTable: 'attendance_records',
      })
    }

    return ok({ processed: incomplete.length })
  } catch (e) {
    return handleError(e)
  }
})
