import { getServiceClient } from '../_shared/supabase.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date()
    const alertDate = new Date(today)
    alertDate.setDate(alertDate.getDate() + 14)
    const alertDateStr = alertDate.toISOString().slice(0, 10)

    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_code')
      .eq('probation_end_date', alertDateStr)
      .eq('is_active', true)

    if (fetchError) throw fetchError

    if (!employees?.length) {
      return ok({ processed: 0, message: 'No probation ends in 14 days' })
    }

    const { data: owners } = await supabase
      .from('employees')
      .select('id')
      .eq('role', 'owner')
      .eq('is_active', true)

    const ownerIds = owners?.map((o) => o.id) ?? []
    let processed = 0

    for (const emp of employees) {
      const notifications = ownerIds.map((recipientId) => ({
        recipient_id: recipientId,
        type: 'probation_end_approaching' as const,
        title: 'Probation period ending soon',
        body: `${emp.first_name} ${emp.last_name} (${emp.employee_code}) probation ends in 14 days.`,
        is_read: false,
      }))

      if (notifications.length > 0) {
        const { error: notifError } = await supabase.from('notifications').insert(notifications)
        if (notifError) {
          console.error('Failed to create notifications:', notifError)
        }
      }

      processed++
    }

    return ok({ processed, total: employees.length })
  } catch (e) {
    return handleError(e)
  }
})
