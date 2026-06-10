import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner'])
    await req.formData()

    // TODO: implement per docs/EDGE_FUNCTIONS.md "bulk-import-employees"
    // 1. Parse CSV/XLSX file
    // 2. For each row: validate required fields (first_name, last_name, email, employment_type,
    //    join_date), validate email format, look up department/designation/manager by name/email
    // 3. For rows that pass: insert employees (same logic as create-employee but bulk,
    //    no Auth accounts created here — send separate welcome emails)
    // 4. For rows that fail: collect { row, error }
    // 5. Commit successful rows; return both counts

    return ok({
      total_rows: 0,
      success_count: 0,
      failure_count: 0,
      failures: [] as { row: number; error: string }[],
    })
  } catch (e) {
    return handleError(e)
  }
})
