import { ok, cors, handleError } from '../_shared/response.ts'

// Cron: daily at 09:15 IST
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    // TODO: implement per docs/EDGE_FUNCTIONS.md "exit-date-alert"
    // 1. Query employees where exit_date = today + 7 AND is_active = true
    // 2. Send email to Owner, HR, and System Admin for each

    return ok({ processed: 0 })
  } catch (e) {
    return handleError(e)
  }
})
