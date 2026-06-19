import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError, err } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])

    const { holiday_id } = await req.json()

    if (!holiday_id) {
      return err('VALIDATION_ERROR', 'holiday_id is required')
    }

    const supabase = getServiceClient()

    const { data: holiday, error: holErr } = await supabase
      .from('holidays')
      .select('*')
      .eq('id', holiday_id)
      .single()

    if (holErr || !holiday) {
      return err('NOT_FOUND', 'Holiday not found')
    }

    if (holiday.date <= new Date().toISOString().split('T')[0]) {
      return err('VALIDATION_ERROR', 'Cannot opt out of a past holiday')
    }

    const { data: approvedLeave } = await supabase
      .from('leave_applications')
      .select('id')
      .eq('employee_id', actor.actorId)
      .eq('status', 'approved')
      .lte('from_date', holiday.date)
      .gte('to_date', holiday.date)
      .maybeSingle()

    if (approvedLeave) {
      return err('CONFLICT', 'You have approved leave for this holiday. Cancel the leave before opting out.')
    }

    const { error: delErr } = await supabase
      .from('employee_optional_holidays')
      .delete()
      .eq('employee_id', actor.actorId)
      .eq('holiday_id', holiday_id)

    if (delErr) {
      if (delErr.code === 'PGRST116') {
        return err('NOT_FOUND', 'You have not opted into this holiday')
      }
      throw delErr
    }

    return ok({ holiday_id, opted_in: false })
  } catch (e) {
    return handleError(e)
  }
})
