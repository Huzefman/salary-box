import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "check-out"
    // 1. Find today's attendance_records row for this employee -> NOT_FOUND if none
    // 2. If check_out_time already set -> CONFLICT
    // 3. Set check_out_time = now() server-side
    // 4. Compute total_hours (BR-ATT-05) and overtime_hours (BR-ATT-07)
    // 5. Update check_out_lat / check_out_lng
    // 6. GPS drift check: if distance between check-in and check-out > 50km -> is_geo_flagged = true

    return ok({
      attendance_record_id: null,
      check_out_time: null,
      total_hours: 0,
      overtime_hours: 0,
      is_geo_flagged: false,
    })
  } catch (e) {
    return handleError(e)
  }
})
