import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { logAudit } from '../_shared/audit.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: requests } = await supabase
      .from('comp_off_requests')
      .select('*')
      .eq('status', 'approved')
      .eq('comp_off_expiry_date', today)
      .not('leave_balance_id', 'is', null)

    if (!requests) return ok({ processed: 0 })

    let processed = 0

    for (const req of requests) {
      if (!req.leave_balance_id) continue

      const { data: balance } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('id', req.leave_balance_id)
        .single()

      if (!balance) continue

      if (balance.accrued > 0) {
        await supabase
          .from('leave_balances')
          .update({ accrued: balance.accrued - 1 })
          .eq('id', balance.id)
      } else {
        await supabase
          .from('leave_balances')
          .update({ adjusted: (balance.adjusted ?? 0) - 1 })
          .eq('id', balance.id)
      }

      await logAudit({
        tableName: 'leave_balances',
        recordId: balance.id,
        action: 'UPDATE',
        actorSystemFunction: 'comp_off_lapse',
        oldData: { accrued: balance.accrued, adjusted: balance.adjusted },
        newData: {
          accrued: Math.max(0, balance.accrued - 1),
          adjusted: balance.accrued > 0 ? balance.adjusted : (balance.adjusted ?? 0) - 1,
        },
      })

      processed++
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
