import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { logAudit } from '../_shared/audit.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: balances } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('carry_forward_expiry', today)
      .gt('carry_forward_amount', 0)

    if (!balances) return ok({ processed: 0 })

    let processed = 0

    for (const bal of balances) {
      await supabase
        .from('leave_balances')
        .update({
          opening_balance: Math.max(0, bal.opening_balance - bal.carry_forward_amount),
          carry_forward_amount: 0,
        })
        .eq('id', bal.id)

      await logAudit({
        tableName: 'leave_balances',
        recordId: bal.id,
        action: 'UPDATE',
        actorSystemFunction: 'carry_forward_lapse',
        oldData: {
          opening_balance: bal.opening_balance,
          carry_forward_amount: bal.carry_forward_amount,
        },
        newData: {
          opening_balance: Math.max(0, bal.opening_balance - bal.carry_forward_amount),
          carry_forward_amount: 0,
        },
      })

      processed++
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
