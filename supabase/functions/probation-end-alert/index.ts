import { ok, cors, handleError } from '../_shared/response.ts'

// Cron: daily at 09:10 IST
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    // TODO: implement per docs/EDGE_FUNCTIONS.md "probation-end-alert" (BR-EMP-07)
    // 1. Query employees where probation_end_date = today + 14 AND is_active = true
    // 2. Send email to Owner for each

    return ok({ processed: 0 })
  } catch (e) {
    return handleError(e)
  }
})
