import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner'])
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "update-app-config"
    // 1. Validate key is one of the known config keys -> VALIDATION_ERROR otherwise
    // 2. Validate value can be parsed to the expected type (integer, boolean, or time string)
    // 3. Upsert app_config row

    return ok({
      key: null,
      value: null,
    })
  } catch (e) {
    return handleError(e)
  }
})
