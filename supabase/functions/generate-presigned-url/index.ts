import { getActor } from '../_shared/auth.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { ok, err, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    const { storage_path, bucket } = await req.json()

    if (!storage_path || !bucket) {
      return err('VALIDATION_ERROR', 'storage_path and bucket are required', 400)
    }

    const supabase = getServiceClient()

    const { data: fileExists, error: statError } = await supabase.storage
      .from(bucket)
      .list(storage_path.split('/').slice(0, -1).join('/'), {
        search: storage_path.split('/').pop(),
        limit: 1,
      })

    if (statError || !fileExists?.length) {
      return err('NOT_FOUND', 'File does not exist in storage', 404)
    }

    const pathParts = storage_path.split('/')
    const fileEmployeeId = pathParts[1]

    const isOwner = actor.actorRole === 'owner'
    const isHR = actor.actorRole === 'hr'
    const isSystemAdmin = actor.actorRole === 'system_admin'
    const isEmployee = actor.actorRole === 'employee'
    const isOwnDocument = fileEmployeeId === actor.actorId

    const hasAccess = isOwner || isHR || isSystemAdmin || (isEmployee && isOwnDocument)
    if (!hasAccess) {
      return err('FORBIDDEN', 'You do not have access to this file', 403)
    }

    const EXPIRY_SECONDS = 15 * 60
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storage_path, EXPIRY_SECONDS)

    if (signedError || !signedData) {
      console.error('Presigned URL error:', signedError)
      return err('INTERNAL_ERROR', 'Failed to generate presigned URL', 500)
    }

    const expiresAt = new Date(Date.now() + EXPIRY_SECONDS * 1000).toISOString()

    return ok({ url: signedData.signedUrl, expires_at: expiresAt })
  } catch (e) {
    return handleError(e)
  }
})
