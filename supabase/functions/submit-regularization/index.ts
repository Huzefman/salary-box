import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "submit-regularization"
    // 1. Fetch attendance_records row; verify it belongs to actor (or owner/hr on behalf of)
    // 2. Validate date is within app_config.regularization_window_days (BR-ATT-08) -> VALIDATION_ERROR
    // 3. Check no pending regularization exists for this record -> CONFLICT
    // 4. Insert attendance_regularization_requests row
    // 5. Notify HR/Owner

    return ok(
      {
        request_id: null,
        status: 'pending',
      },
      201
    )
  } catch (e) {
    return handleError(e)
  }
})
