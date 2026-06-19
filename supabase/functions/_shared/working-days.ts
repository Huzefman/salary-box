import { getServiceClient } from './supabase.ts'

export async function countWorkingDays(
  employeeId: string,
  fromDate: string,
  toDate: string
): Promise<number> {
  const supabase = getServiceClient()

  const { data: holidays } = await supabase
    .from('holidays')
    .select('id, date, is_optional')
    .gte('date', fromDate)
    .lte('date', toDate)

  const { data: optIns } = await supabase
    .from('employee_optional_holidays')
    .select('holiday_id')
    .eq('employee_id', employeeId)

  const optInIds = new Set((optIns ?? []).map((o: { holiday_id: string }) => o.holiday_id))

  const nonWorkingDates = new Set<string>()
  for (const h of holidays ?? []) {
    if (!h.is_optional || optInIds.has(h.id)) {
      nonWorkingDates.add(h.date)
    }
  }

  // TODO: factor in shift weekly-offs once shift resolution is stable (BR-ATT-11)
  let count = 0
  const current = new Date(fromDate + 'T00:00:00Z')
  const end = new Date(toDate + 'T00:00:00Z')

  while (current <= end) {
    const dow = current.getUTCDay()
    const dateStr = current.toISOString().split('T')[0]
    if (dow !== 0 && dow !== 6 && !nonWorkingDates.has(dateStr)) {
      count++
    }
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return count
}
