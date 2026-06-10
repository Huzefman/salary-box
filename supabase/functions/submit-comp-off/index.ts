import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "submit-comp-off"
    // 1. Validate worked_date is a holiday or weekly-off per the employee's shift -> VALIDATION_ERROR
    // 2. Insert comp_off_requests row with status = 'pending'
    // 3. Notify HR/Owner

    return ok(
      {
        request_id: null,
      },
      201
    )
  } catch (e) {
    return handleError(e)
  }
})
