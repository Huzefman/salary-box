import { getActor } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    await getActor(req)
    await req.json().catch(() => ({}))

    // TODO: implement per docs/EDGE_FUNCTIONS.md "generate-presigned-url"
    // 1. Verify actor has access to the requested file based on bucket and role
    //    (mirrors storage RLS from docs/ROLE_RULES.md) -> FORBIDDEN otherwise
    // 2. Verify file exists in storage -> NOT_FOUND otherwise
    // 3. Generate a presigned URL with 15-minute expiry via Supabase storage

    return ok({
      url: null,
      expires_at: null,
    })
  } catch (e) {
    return handleError(e)
  }
})
