import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "check-in"
    // 1. Check IP whitelist (BR-ATT-10) -> FORBIDDEN if client IP not allowed
    // 2. Check GPS geofence (BR-ATT-09) -> set is_geo_flagged if outside all geofences
    // 3. Resolve today's shift via resolveShift() (BR-ATT-11)
    // 4. Upsert attendance_records for (employee_id, today); set check_in_time = now()
    //    only if not already set, else return CONFLICT
    // 5. Set is_late per BR-ATT-06

    return ok({
      attendance_record_id: null,
      check_in_time: null,
      is_late: false,
      is_geo_flagged: false,
    })
  } catch (e) {
    return handleError(e)
  }
})
