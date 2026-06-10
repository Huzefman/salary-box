import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "request-leave-cancellation"
    // 1. Fetch application; verify it belongs to actor (or owner/hr) -> FORBIDDEN
    // 2. Verify status = 'approved' and from_date > today -> CONFLICT otherwise
    // 3. Set cancellation_requested = true, cancellation_requested_at = now(), cancellation_reason
    // 4. Do NOT change status
    // 5. Notify HR/Owner

    return ok({
      application_id: null,
      cancellation_requested: true,
    })
  } catch (e) {
    return handleError(e)
  }
})
