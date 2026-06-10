import { getServiceClient } from './supabase.ts'

export async function logAudit({
  tableName,
  recordId,
  action,
  actorId,
  actorRole,
  actorSystemFunction,
  oldData,
  newData,
}: {
  tableName: string
  recordId: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  actorId?: string
  actorRole?: string
  actorSystemFunction?: string
  oldData?: unknown
  newData?: unknown
}): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.from('audit_logs').insert({
    table_name: tableName,
    record_id: recordId,
    action,
    actor_id: actorId ?? null,
    actor_role: actorRole ?? null,
    actor_system_function: actorSystemFunction ?? null,
    old_data: oldData ?? null,
    new_data: newData ?? null,
  })
  if (error) console.error('Failed to write audit log:', error)
}
