import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()

    const plus7 = new Date()
    plus7.setDate(plus7.getDate() + 7)
    const target7 = plus7.toISOString().split('T')[0]

    const { data: requests } = await supabase
      .from('comp_off_requests')
      .select('*')
      .eq('status', 'approved')
      .eq('comp_off_expiry_date', target7)

    if (!requests) return ok({ processed: 0 })

    let processed = 0

    for (const req of requests) {
      await createNotification({
        recipientId: req.employee_id,
        title: 'Comp-Off Expiring Soon',
        body: `Your comp-off for ${req.worked_date} will expire in 7 days (${req.comp_off_expiry_date}). Please use it before it lapses.`,
        type: 'comp_off_expiry_alert',
        referenceId: req.id,
        referenceTable: 'comp_off_requests',
      })

      processed++
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
