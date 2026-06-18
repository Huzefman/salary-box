import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])

    const today = new Date().toISOString().slice(0, 10)
    const supabase = getServiceClient()

    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id, status')
      .eq('employee_id', actor.actorId)
      .eq('date', today)
      .maybeSingle()

    if (existing?.status === 'on_leave') {
      throw {
        code: 'CONFLICT',
        message: 'Cannot log WFH on an approved leave day.',
        status: 409,
      }
    }

    const { data: record, error } = await supabase
      .from('attendance_records')
      .upsert(
        {
          employee_id: actor.actorId,
          date: today,
          is_wfh: true,
        },
        { onConflict: 'employee_id, date', ignoreDuplicates: false }
      )
      .select('id, is_wfh')
      .single()

    if (error) throw error

    return ok({
      attendance_record_id: record.id,
      is_wfh: record.is_wfh,
    })
  } catch (e) {
    return handleError(e)
  }
})
