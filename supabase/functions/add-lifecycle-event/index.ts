import { getActor, assertRole } from '../_shared/auth.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { ok, err, cors, handleError } from '../_shared/response.ts'

type EventType = 'promotion' | 'transfer' | 'salary_revision' | 'resignation' | 'termination' | 'rehire'
type LifecycleBody = {
  employee_id: string
  event_type: EventType
  effective_date: string
  previous_department_id?: string | null
  new_department_id?: string | null
  previous_designation_id?: string | null
  new_designation_id?: string | null
  previous_salary?: number | null
  new_salary?: number | null
  reason?: string | null
  document_path?: string | null
}

const OWNER_EVENTS: EventType[] = ['promotion', 'transfer', 'salary_revision', 'resignation', 'termination', 'rehire']
const HR_EVENTS: EventType[] = ['promotion', 'transfer', 'resignation']

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])

    const body: LifecycleBody = await req.json()
    const { employee_id, event_type, effective_date } = body

    if (!employee_id || !event_type || !effective_date) {
      return err('VALIDATION_ERROR', 'employee_id, event_type, and effective_date are required', 400)
    }

    const allowed = actor.actorRole === 'owner' ? OWNER_EVENTS : HR_EVENTS
    if (!allowed.includes(event_type)) {
      return err('FORBIDDEN', `${actor.actorRole} role is not allowed to perform ${event_type} events`, 403)
    }

    const supabase = getServiceClient()

    if (event_type === 'termination') {
      const { data: orphanedReports } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_code')
        .eq('reporting_manager_id', employee_id)
        .eq('is_active', true)

      if (orphanedReports && orphanedReports.length > 0) {
        return err('CONFLICT', `Cannot terminate: ${orphanedReports.length} employee(s) still report to them`, 409, {
          affected_employees: orphanedReports,
        })
      }

      const today = new Date().toISOString().split('T')[0]
      const isImmediate = effective_date <= today

      await supabase
        .from('employees')
        .update({
          employment_status: 'terminated',
          exit_date: effective_date,
          ...(isImmediate ? { is_active: false } : {}),
        })
        .eq('id', employee_id)

      if (isImmediate) {
        const { data: emp } = await supabase
          .from('employees')
          .select('auth_id')
          .eq('id', employee_id)
          .single()

        if (emp?.auth_id) {
          await supabase.auth.admin.deleteUser(emp.auth_id).catch(() => {})
        }
      }
    }

    if (event_type === 'salary_revision') {
      if (body.new_salary == null) {
        return err('VALIDATION_ERROR', 'new_salary is required for salary_revision events', 400)
      }
      await supabase
        .from('employees')
        .update({ current_salary: body.new_salary })
        .eq('id', employee_id)
    }

    if (event_type === 'transfer') {
      if (!body.new_department_id) {
        return err('VALIDATION_ERROR', 'new_department_id is required for transfer events', 400)
      }
      await supabase
        .from('employees')
        .update({ department_id: body.new_department_id })
        .eq('id', employee_id)
    }

    if (event_type === 'promotion') {
      if (!body.new_designation_id) {
        return err('VALIDATION_ERROR', 'new_designation_id is required for promotion events', 400)
      }
      await supabase
        .from('employees')
        .update({ designation_id: body.new_designation_id })
        .eq('id', employee_id)
    }

    if (event_type === 'resignation') {
      await supabase
        .from('employees')
        .update({ employment_status: 'resigned', exit_date: effective_date })
        .eq('id', employee_id)
    }

    if (event_type === 'rehire') {
      await supabase
        .from('employees')
        .update({
          employment_status: 'active',
          is_active: true,
          exit_date: null,
        })
        .eq('id', employee_id)
    }

    const { data: event, error: insertError } = await supabase
      .from('employee_lifecycle_events')
      .insert({
        employee_id,
        event_type,
        effective_date,
        previous_department_id: body.previous_department_id ?? null,
        new_department_id: body.new_department_id ?? null,
        previous_designation_id: body.previous_designation_id ?? null,
        new_designation_id: body.new_designation_id ?? null,
        previous_salary: body.previous_salary ?? null,
        new_salary: body.new_salary ?? null,
        reason: body.reason ?? null,
        document_path: body.document_path ?? null,
        performed_by: actor.actorId,
      })
      .select('id')
      .single()

    if (insertError || !event) {
      console.error('Lifecycle event insert error:', insertError)
      return err('INTERNAL_ERROR', 'Failed to insert lifecycle event', 500)
    }

    return ok({ event_id: event.id }, 201)
  } catch (e) {
    return handleError(e)
  }
})
