const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function cors(): Response {
  return new Response(null, { headers: CORS_HEADERS })
}

export function ok(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

export function err(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): Response {
  return new Response(
    JSON.stringify({ error: { code, message, ...(details !== undefined ? { details } : {}) } }),
    {
      status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  )
}

export function handleError(e: unknown): Response {
  if (e && typeof e === 'object' && 'code' in e) {
    const error = e as { code: string; message: string; status?: number }
    return err(error.code, error.message, error.status ?? 400)
  }
  console.error('Unexpected error:', e)
  return err('INTERNAL_ERROR', 'An unexpected error occurred', 500)
}
