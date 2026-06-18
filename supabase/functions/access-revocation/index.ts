import { getServiceClient } from '../_shared/supabase.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

// Cron: daily at 23:55 IST (BR-EMP-05)
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date().toISOString().slice(0, 10)

    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, auth_id')
      .eq('exit_date', today)
      .eq('is_active', true)

    if (fetchError) throw fetchError

    if (!employees?.length) {
      return ok({ processed: 0, message: 'No employees to deactivate today' })
    }

    let processed = 0
    const errors: { id: string; error: string }[] = []

    for (const emp of employees) {
      // Deactivate the employee record
      const { error: updateError } = await supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', emp.id)

      if (updateError) {
        errors.push({ id: emp.id, error: updateError.message })
        continue
      }

      // Revoke auth account access
      if (emp.auth_id) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(emp.auth_id)
        if (deleteError) {
          errors.push({ id: emp.id, error: `Auth revoke failed: ${deleteError.message}` })
        }
      }

      processed++
    }

    return ok({ processed, total: employees.length, errors: errors.length > 0 ? errors : undefined })
  } catch (e) {
    return handleError(e)
  }
})
