import { getServiceClient } from '../_shared/supabase.ts'
import { ok, cors, handleError } from '../_shared/response.ts'

// Cron: daily at 09:15 IST
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const supabase = getServiceClient()
    const today = new Date()
    const alertDate = new Date(today)
    alertDate.setDate(alertDate.getDate() + 7)
    const alertDateStr = alertDate.toISOString().slice(0, 10)

    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_code')
      .eq('exit_date', alertDateStr)
      .eq('is_active', true)

    if (fetchError) throw fetchError

    if (!employees?.length) {
      return ok({ processed: 0, message: 'No upcoming exits in 7 days' })
    }

    // Fetch all notification recipients (Owner, HR, System Admin)
    const { data: recipients } = await supabase
      .from('employees')
      .select('id')
      .in('role', ['owner', 'hr', 'system_admin'])
      .eq('is_active', true)

    const recipientIds = recipients?.map((r) => r.id) ?? []
    let processed = 0

    for (const emp of employees) {
      const notifications = recipientIds.map((recipientId) => ({
        recipient_id: recipientId,
        type: 'exit_date_upcoming' as const,
        title: 'Upcoming exit date',
        body: `${emp.first_name} ${emp.last_name} (${emp.employee_code}) has an exit date in 7 days.`,
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
