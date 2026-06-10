import { getActor, assertRole } from '../_shared/auth.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner', 'hr', 'employee'])
    await req.formData()

    // TODO: implement per docs/EDGE_FUNCTIONS.md "upload-document"
    // 1. If actor role is 'employee', verify employee_id == actor's own id -> FORBIDDEN otherwise
    // 2. Validate MIME type (PDF, JPEG, PNG only) and size <= 5MB -> VALIDATION_ERROR
    // 3. Compute SHA-256 document_hash of the file bytes
    // 4. For 'pan'/'aadhar': check document_hash against other active employees' employee_documents
    //    -> DUPLICATE unless owner passes force: true with override_reason
    // 5. Upload file to employee-documents/{employee_id}/{uuid}.{ext}
    // 6. Insert employee_documents row

    return ok(
      {
        document_id: null,
        storage_path: null,
      },
      201
    )
  } catch (e) {
    return handleError(e)
  }
})
