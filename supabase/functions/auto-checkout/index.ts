import { ok, cors, handleError } from '../_shared/response.ts'

// Cron: daily at app_config.auto_checkout_time IST (default 23:59)
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    // TODO: implement per docs/EDGE_FUNCTIONS.md "auto-checkout" (BR-ATT-03)
    // 1. Query attendance_records where date = today AND check_in_time IS NOT NULL
    //    AND check_out_time IS NULL
    // 2. For each: set check_out_time = auto_checkout_time, status = 'incomplete'
    // 3. Insert notification (type: attendance_incomplete) for each employee

    return ok({ processed: 0 })
  } catch (e) {
    return handleError(e)
  }
})
