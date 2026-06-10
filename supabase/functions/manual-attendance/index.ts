import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "manual-attendance"
    // 1. Upsert attendance_records for (employee_id, date)
    // 2. Set is_manually_entered = true, manual_entry_reason, manual_entry_by = actor_id
    // 3. Compute total_hours, overtime_hours, is_late server-side
    // 4. Recompute status per BR-ATT-04

    return ok({
      attendance_record_id: null,
      status: 'present',
      total_hours: 0,
    })
  } catch (e) {
    return handleError(e)
  }
})
