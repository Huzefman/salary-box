import { supabase } from './supabase'

export async function callEdgeFunction<TBody, TResponse>(
  functionName: string,
  body: TBody
): Promise<TResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw { code: 'UNAUTHORIZED', message: 'Not authenticated' }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  )

  const json = await res.json()
  if (!res.ok) throw json.error
  return json.data as TResponse
}

export async function callEdgeFunctionFormData<TResponse>(
  functionName: string,
  formData: FormData
): Promise<TResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw { code: 'UNAUTHORIZED', message: 'Not authenticated' }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  )

  const json = await res.json()
  if (!res.ok) throw json.error
  return json.data as TResponse
}
