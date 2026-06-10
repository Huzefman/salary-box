import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "confirm-leave-cancellation"
    // 1. Fetch application; verify cancellation_requested = true -> NOT_FOUND otherwise
    // 2. If confirm:
    //    - status = 'cancelled', cancelled_by, cancelled_at = now(), cancellation_requested = false
    //    - reverse leave_balances.taken for future dates only (BR-LVE-05)
    //    - revert attendance_records.status from 'on_leave' to 'absent' for future dates (BR-LVE-04)
    // 3. If reject:
    //    - cancellation_requested = false; status remains 'approved'
    // 4. Notify employee

    return ok({
      application_id: null,
      status: 'approved',
    })
  } catch (e) {
    return handleError(e)
  }
})
