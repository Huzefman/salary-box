import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { createNotification } from '../_shared/notify.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr'])
    const body = await req.json()

    const { request_id, action, comment } = body

    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      throw { code: 'VALIDATION_ERROR', message: 'request_id and action (approve|reject) are required.', status: 400 }
    }

    const supabase = getServiceClient()

    const { data: reqRecord } = await supabase
      .from('attendance_regularization_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (!reqRecord) {
      throw { code: 'NOT_FOUND', message: 'Regularization request not found.', status: 404 }
    }

    if (reqRecord.status !== 'pending') {
      throw { code: 'CONFLICT', message: 'This request has already been reviewed.', status: 409 }
    }

    const now = new Date().toISOString()

    if (action === 'approve') {
      const updates: Record<string, unknown> = {}

      if (reqRecord.requested_status) {
        updates.status = reqRecord.requested_status
      }

      if (reqRecord.requested_check_in) {
        updates.check_in_time = reqRecord.requested_check_in
      }

      if (reqRecord.requested_check_out) {
        updates.check_out_time = reqRecord.requested_check_out
      }

      updates.is_manually_entered = true
      updates.manual_entry_by = actor.actorId
      updates.manual_entry_reason = 'Regularized via request'

      const { error: attError } = await supabase
        .from('attendance_records')
        .update(updates)
        .eq('id', reqRecord.attendance_record_id)

      if (attError) throw attError
    }

    const { error: updateError } = await supabase
      .from('attendance_regularization_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: actor.actorId,
        reviewed_at: now,
        reviewer_comment: comment || null,
      })
      .eq('id', request_id)

    if (updateError) throw updateError

    await createNotification({
      recipientId: reqRecord.employee_id,
      title: 'Regularization Request Reviewed',
      body: action === 'approve'
        ? 'Your regularization request has been approved.'
        : `Your regularization request has been rejected.${comment ? ` Comment: ${comment}` : ''}`,
      type: 'regularization_reviewed',
      referenceId: request_id,
      referenceTable: 'attendance_regularization_requests',
    })

    return ok({
      request_id,
      status: action === 'approve' ? 'approved' : 'rejected',
    })
  } catch (e) {
    return handleError(e)
  }
})
