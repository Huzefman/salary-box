import { ok, cors, handleError } from '../_shared/response.ts'

// Cron: 1st of each month at 00:10 IST
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    // TODO: implement per docs/EDGE_FUNCTIONS.md "late-mark-deduction" (BR-ATT-06)
    // 1. For each active employee: count is_late = true records in the previous month
    // 2. If count >= shift.late_mark_threshold: deduct 0.5 days from leave balance
    //    (CL first, then EL, then LWP)
    // 3. Log deduction to leave_balances.adjusted with reason 'late_mark_deduction'

    return ok({ processed: 0 })
  } catch (e) {
    return handleError(e)
  }
})
