import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError, err } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { isHoliday } from '../_shared/holiday.ts'
import { resolveShift } from '../_shared/shift.ts'
import { isWeeklyOff } from '../_shared/holiday.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])

    const { worked_date, hours_worked, reason } = await req.json()

    if (!worked_date || !hours_worked || !reason) {
      return err('VALIDATION_ERROR', 'worked_date, hours_worked, and reason are required')
    }

    const supabase = getServiceClient()
    const shift = await resolveShift(actor.actorId, worked_date)

    if (shift.weekly_off_days.length > 0) {
      const dow = new Date(worked_date + 'T00:00:00+05:30').getDay()
      if (shift.weekly_off_days.includes(dow)) {
        const { data: request, error: insErr } = await supabase
          .from('comp_off_requests')
          .insert({
            employee_id: actor.actorId,
            worked_date,
            hours_worked,
            reason,
            status: 'pending',
          })
          .select()
          .single()

        if (insErr) throw insErr

        const { data: admins } = await supabase
          .from('employees')
          .select('id')
          .in('role', ['owner', 'hr'])
          .eq('is_active', true)

        for (const admin of admins ?? []) {
          await createNotification({
            recipientId: admin.id,
            title: 'Comp-Off Request Submitted',
            body: `${reason}`,
            type: 'comp_off_submitted',
            referenceId: request.id,
            referenceTable: 'comp_off_requests',
          })
        }

        return ok({ request_id: request.id }, 201)
      }
    }

    const holiday = await isHoliday(actor.actorId, worked_date)
    if (holiday) {
      const { data: request, error: insErr } = await supabase
        .from('comp_off_requests')
        .insert({
          employee_id: actor.actorId,
          worked_date,
          hours_worked,
          reason,
          status: 'pending',
        })
        .select()
        .single()

      if (insErr) throw insErr

      const { data: admins } = await supabase
        .from('employees')
        .select('id')
        .in('role', ['owner', 'hr'])
        .eq('is_active', true)

      for (const admin of admins ?? []) {
        await createNotification({
          recipientId: admin.id,
          title: 'Comp-Off Request Submitted',
          body: `${reason}`,
          type: 'comp_off_submitted',
          referenceId: request.id,
          referenceTable: 'comp_off_requests',
        })
      }

      return ok({ request_id: request.id }, 201)
    }

    return err('VALIDATION_ERROR', 'worked_date is not a holiday or weekly-off day')
  } catch (e) {
    return handleError(e)
  }
})
