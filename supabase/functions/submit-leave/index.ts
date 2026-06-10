import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "submit-leave"
    // 1. Validate leave_type is active and applicable_gender (BR-LVE-17)
    // 2. Validate min_notice_days (BR-LVE-16); exempt owner/hr
    // 3. Compute working_days_count via countWorkingDays() (BR-LVE-01); must be > 0
    // 4. Validate max_consecutive_days (BR-LVE-15)
    // 5. Validate attachment if required (BR-LVE-13)
    // 6. Check overlap (BR-LVE-03) -> CONFLICT
    // 7. Validate leave balance (BR-LVE-02); increment leave_balances.pending
    // 8. Insert leave_applications row with status = 'pending'
    // 9. If reporting manager is on leave (BR-LVE-07), set escalated_to = owner.id
    // 10. Notify approver

    return ok(
      {
        application_id: null,
        working_days_count: 0,
        status: 'pending',
        escalated_to: null,
      },
      201
    )
  } catch (e) {
    return handleError(e)
  }
})
