import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "review-comp-off"
    // 1. Fetch request; verify status = 'pending' -> NOT_FOUND / CONFLICT
    // 2. Set status, reviewed_by, reviewed_at
    // 3. If approve:
    //    - comp_off_expiry_date = worked_date + app_config.comp_off_expiry_days
    //    - find or create leave_balances row for the comp-off leave type for current year
    //    - increment leave_balances.accrued += 1
    //    - set leave_balance_id on the comp-off request
    // 4. Notify employee

    return ok({
      request_id: null,
      status: 'approved',
      comp_off_expiry_date: null,
    })
  } catch (e) {
    return handleError(e)
  }
})
