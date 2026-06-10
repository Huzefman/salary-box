import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "review-regularization"
    // 1. Fetch request; verify status = 'pending' -> NOT_FOUND / CONFLICT
    // 2. Set status, reviewed_by, reviewed_at, reviewer_comment
    // 3. If approve:
    //    - update linked attendance_records with requested_status, requested_check_in, requested_check_out
    //    - recompute total_hours, overtime_hours, is_late (BR-ATT-05, BR-ATT-06, BR-ATT-07)
    // 4. Notify employee

    return ok({
      request_id: null,
      status: 'approved',
    })
  } catch (e) {
    return handleError(e)
  }
})
