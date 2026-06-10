import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "opt-in-holiday"
    // 1. Fetch holiday; verify is_optional = true and date is in the future -> VALIDATION_ERROR
    // 2. Count existing opt-ins for (employee_id, year); if >= app_config.optional_holiday_limit_per_year -> FORBIDDEN
    // 3. Insert employee_optional_holidays row

    return ok(
      {
        holiday_id: null,
        opted_in: true,
      },
      201
    )
  } catch (e) {
    return handleError(e)
  }
})
