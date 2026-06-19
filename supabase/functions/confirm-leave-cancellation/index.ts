import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError, err } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])

    const { application_id, action, comment } = await req.json()

    if (!application_id || !['confirm', 'reject'].includes(action)) {
      return err('VALIDATION_ERROR', 'application_id and action (confirm|reject) are required')
    }

    const supabase = getServiceClient()

    const { data: app, error: appErr } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', application_id)
      .single()

    if (appErr || !app) {
      return err('NOT_FOUND', 'Leave application not found')
    }

    if (!app.cancellation_requested) {
      return err('NOT_FOUND', 'No pending cancellation request for this application')
    }

    if (action === 'confirm') {
      const today = new Date().toISOString().split('T')[0]

      await supabase
        .from('leave_applications')
        .update({
          status: 'cancelled',
          cancellation_requested: false,
          cancelled_by: actor.actorId,
          cancelled_at: new Date().toISOString(),
          reviewer_comment: comment ?? null,
        })
        .eq('id', application_id)

      if (app.to_date >= today) {
        const { data: balance } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('employee_id', app.employee_id)
          .eq('leave_type_id', app.leave_type_id)
          .eq('year', app.from_date.substring(0, 4))
          .single()

        if (balance) {
          const futureWorkingDays = app.working_days_count
          await supabase
            .from('leave_balances')
            .update({ taken: Math.max(0, balance.taken - futureWorkingDays) })
            .eq('id', balance.id)
        }

        const { data: records } = await supabase
          .from('attendance_records')
          .select('id, date')
          .eq('employee_id', app.employee_id)
          .gte('date', today)
          .lte('date', app.to_date)
          .eq('status', 'on_leave')

        for (const rec of records ?? []) {
          await supabase
            .from('attendance_records')
            .update({ status: 'absent' })
            .eq('id', rec.id)
        }
      }

      await createNotification({
        recipientId: app.employee_id,
        title: 'Leave Cancellation Confirmed',
        body: `Your leave cancellation request has been confirmed.${comment ? ` Note: ${comment}` : ''}`,
        type: 'cancellation_confirmed',
        referenceId: application_id,
        referenceTable: 'leave_applications',
      })

      return ok({ application_id, status: 'cancelled' })
    } else {
      await supabase
        .from('leave_applications')
        .update({
          cancellation_requested: false,
          reviewer_comment: comment ?? null,
        })
        .eq('id', application_id)

      await createNotification({
        recipientId: app.employee_id,
        title: 'Leave Cancellation Rejected',
        body: `Your leave cancellation request was not approved.${comment ? ` Reason: ${comment}` : ''}`,
        type: 'cancellation_rejected',
        referenceId: application_id,
        referenceTable: 'leave_applications',
      })

      return ok({ application_id, status: 'approved' })
    }
  } catch (e) {
    return handleError(e)
  }
})
