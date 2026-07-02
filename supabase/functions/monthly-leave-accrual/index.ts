import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { logAudit } from '../_shared/audit.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = now.getMonth()

    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('id, accrual_days')
      .eq('accrual_type', 'monthly')
      .eq('is_active', true)

    if (!leaveTypes || leaveTypes.length === 0) {
      return ok({ processed: 0 })
    }

    let processed = 0

    for (const lt of leaveTypes) {
      const monthlyAccrual = Math.round((lt.accrual_days / 12) * 100) / 100

      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('is_active', true)

      for (const emp of employees ?? []) {
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('leave_type_id', lt.id)
          .eq('year', year)
          .maybeSingle()

        if (balance) {
          await supabase
            .from('leave_balances')
            .update({ accrued: balance.accrued + monthlyAccrual })
            .eq('id', balance.id)

          await logAudit({
            tableName: 'leave_balances',
            recordId: balance.id,
            action: 'UPDATE',
            actorSystemFunction: 'monthly_leave_accrual',
            newData: { accrued: balance.accrued + monthlyAccrual },
            oldData: { accrued: balance.accrued },
          })

          processed++
        }
      }
    }

    return ok({ processed })
  } catch (e) {
    return handleError(e)
  }
})
