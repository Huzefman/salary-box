import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date().toISOString().split('T')[0]

    const plus30 = new Date()
    plus30.setDate(plus30.getDate() + 30)
    const target30 = plus30.toISOString().split('T')[0]

    const plus7 = new Date()
    plus7.setDate(plus7.getDate() + 7)
    const target7 = plus7.toISOString().split('T')[0]

    const { data: balances } = await supabase
      .from('leave_balances')
      .select('*, employees!inner(id, first_name, last_name), leave_types!inner(name)')
      .not('carry_forward_expiry', 'is', null)
      .in('carry_forward_expiry', [target30, target7])
      .gt('carry_forward_amount', 0)

    if (!balances) return ok({ processed: 0 })

    let processed = 0

    for (const bal of balances) {
      const emp = bal.employees as unknown as { id: string; first_name: string; last_name: string }
      const lt = bal.leave_types as unknown as { name: string }
      const daysUntilExpiry = bal.carry_forward_expiry === target30 ? 30 : 7

      await createNotification({
        recipientId: emp.id,
        title: 'Carry-Forward Balance Expiring',
        body: `Your ${lt.name} carry-forward balance of ${bal.carry_forward_amount} days will expire in ${daysUntilExpiry} days (${bal.carry_forward_expiry}).`,
        type: 'carry_forward_expiry_alert',
        referenceId: bal.id,
        referenceTable: 'leave_balances',
      })

      processed++
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
