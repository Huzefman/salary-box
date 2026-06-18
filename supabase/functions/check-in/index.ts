import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { resolveShift } from '../_shared/shift.ts'
import { checkIpWhitelist } from '../_shared/ip.ts'
import { checkGeofence } from '../_shared/geo.ts'
import { computeIsLate } from '../_shared/attendance.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    const { latitude, longitude } = await req.json().catch(() => ({}))

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''

    const ipCheck = await checkIpWhitelist(clientIp)
    if (!ipCheck.allowed) {
      throw { code: 'FORBIDDEN', message: ipCheck.message, status: 403 }
    }

    const today = new Date().toISOString().slice(0, 10)
    const supabase = getServiceClient()
    const shift = await resolveShift(actor.actorId, today)

    let isGeoFlagged = false
    if (latitude != null && longitude != null) {
      const geoCheck = await checkGeofence(Number(latitude), Number(longitude))
      if (!geoCheck.inside) isGeoFlagged = true
    }

    const now = new Date().toISOString()
    const isLate = computeIsLate(now, shift.start_time, shift.grace_period_minutes)

    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id, check_in_time')
      .eq('employee_id', actor.actorId)
      .eq('date', today)
      .maybeSingle()

    if (existing?.check_in_time) {
      throw { code: 'CONFLICT', message: 'Already checked in today.', status: 409 }
    }

    const payload: Record<string, unknown> = {
      employee_id: actor.actorId,
      date: today,
      shift_id: shift.id,
      check_in_time: now,
      check_in_ip: clientIp || null,
      is_late: isLate,
      is_geo_flagged: isGeoFlagged,
    }
    if (latitude != null) payload.check_in_lat = Number(latitude)
    if (longitude != null) payload.check_in_lng = Number(longitude)

    const { data: record, error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'employee_id, date', ignoreDuplicates: false })
      .select('id, check_in_time, is_late, is_geo_flagged')
      .single()

    if (error) throw error

    return ok({
      attendance_record_id: record.id,
      check_in_time: record.check_in_time,
      is_late: record.is_late,
      is_geo_flagged: record.is_geo_flagged,
    })
  } catch (e) {
    return handleError(e)
  }
})
