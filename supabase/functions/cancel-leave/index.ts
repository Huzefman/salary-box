import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "cancel-leave"
    // 1. Fetch application; verify it belongs to actor (or actor is owner/hr) -> FORBIDDEN
    // 2. Verify status = 'pending'; if approved -> CONFLICT (use request-leave-cancellation)
    // 3. Set status = 'cancelled', cancelled_by, cancelled_at, cancellation_reason
    // 4. Reverse leave_balances.pending -= working_days_count

    return ok({
      application_id: null,
      status: 'cancelled',
    })
  } catch (e) {
    return handleError(e)
  }
})
