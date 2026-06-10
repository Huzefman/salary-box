import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "add-lifecycle-event"
    // Allowed event_type by role:
    //   owner: promotion, transfer, salary_revision, resignation, termination, rehire
    //   hr: promotion, transfer, resignation
    // 1. Verify actor role against allowed event_type list -> FORBIDDEN otherwise
    //    (termination & salary_revision are owner-only, BR-EMP-09)
    // 2. If termination:
    //    - verify no orphaned reporting_manager_id references (BR-EMP-04) -> CONFLICT with affected list
    //    - set employment_status = 'terminated', exit_date = effective_date
    //    - if effective_date = today: set is_active = false, invalidate Supabase Auth session
    // 3. If salary_revision: update employees.current_salary = new_salary (BR-EMP-09)
    // 4. If transfer: update employees.department_id = new_department_id
    // 5. If promotion: update employees.designation_id = new_designation_id
    // 6. Insert employee_lifecycle_events row (immutable)

    return ok(
      {
        event_id: null,
      },
      201
    )
  } catch (e) {
    return handleError(e)
  }
})
