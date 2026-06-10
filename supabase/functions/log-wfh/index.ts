import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])

    // TODO: implement per docs/EDGE_FUNCTIONS.md "log-wfh"
    // 1. Upsert attendance_records for (employee_id, today), set is_wfh = true
    // 2. Do not overwrite check_in_time or any other field
    // 3. If status is already 'on_leave' -> CONFLICT

    return ok({
      attendance_record_id: null,
      is_wfh: true,
    })
  } catch (e) {
    return handleError(e)
  }
})
