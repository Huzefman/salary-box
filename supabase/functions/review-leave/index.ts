import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "review-leave"
    // 1. Fetch application; verify status = 'pending' -> NOT_FOUND / CONFLICT
    // 2. Set reviewed_by, reviewed_at, reviewer_comment
    // 3. If approve:
    //    - status = 'approved'
    //    - leave_balances: taken += working_days_count, pending -= working_days_count (BR-LVE-05)
    //    - upsert attendance_records for each working day with status = 'on_leave' (BR-LVE-04)
    // 4. If reject:
    //    - status = 'rejected'
    //    - leave_balances.pending -= working_days_count (BR-LVE-05)
    // 5. Notify employee

    return ok({
      application_id: null,
      status: 'approved',
    })
  } catch (e) {
    return handleError(e)
  }
})
