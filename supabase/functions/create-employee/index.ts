import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "create-employee"
    // 1. Validate email uniqueness -> DUPLICATE
    // 2. Auto-generate employee_code in format EMP-YYYY-NNNN (BR-EMP-01)
    // 3. Set employment_status: join_date > today -> 'future_joiner', else 'active'
    // 4. Insert employees row
    // 5. Create Supabase Auth account; set is_first_login = true
    // 6. Send welcome email with temp password
    // 7. Create employee_onboarding_progress rows from active onboarding_checklist_templates
    // 8. Create leave_balances rows for current year for all active leave types

    return ok(
      {
        employee_id: null,
        employee_code: null,
        employment_status: 'active',
      },
      201
    )
  } catch (e) {
    return handleError(e)
  }
})
