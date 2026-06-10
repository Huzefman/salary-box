import { ok, cors, handleError } from '../_shared/response.ts'

// Cron: 1st of each month at 00:15 IST
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    // TODO: implement per docs/EDGE_FUNCTIONS.md "monthly-leave-accrual" (BR-LVE-10)
    // 1. For each active employee x leave type where accrual_type = 'monthly':
    //    credit accrual_days / 12 to leave_balances.accrued for the current year row

    return ok({ processed: 0 })
  } catch (e) {
    return handleError(e)
  }
})
