import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "opt-out-holiday"
    // 1. Verify date is in the future -> VALIDATION_ERROR
    // 2. Check no approved leave exists for this employee on this holiday date (BR-LVE-18) -> CONFLICT
    // 3. Delete employee_optional_holidays row for (employee_id, holiday_id)

    return ok({
      holiday_id: null,
      opted_in: false,
    })
  } catch (e) {
    return handleError(e)
  }
})
