import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    const { data: incomplete } = await supabase
      .from('attendance_records')
      .select('id, employee_id')
      .eq('date', yesterday)
      .eq('status', 'incomplete')

    if (!incomplete || incomplete.length === 0) {
      return ok({ processed: 0 })
    }

    for (const record of incomplete) {
      await createNotification({
        recipientId: record.employee_id,
        title: 'Incomplete Attendance',
        body: `Your attendance for ${yesterday} was incomplete. Would you like to submit a regularization request?`,
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
