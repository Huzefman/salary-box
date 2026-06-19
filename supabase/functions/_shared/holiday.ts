import { getServiceClient } from './supabase.ts'
import type { ShiftInfo } from './shift.ts'

export async function isHoliday(
  employeeId: string,
  date: string
): Promise<boolean> {
  const supabase = getServiceClient()

  const { data: holidays } = await supabase
    .from('holidays')
    .select('id, is_optional')
    .eq('date', date)

  if (!holidays || holidays.length === 0) return false

  const nonOptional = holidays.filter((h) => !h.is_optional)
  if (nonOptional.length > 0) return true

  const optionalIds = holidays.map((h) => h.id)
  const { data: opted } = await supabase
    .from('employee_optional_holidays')
    .select('holiday_id')
    .eq('employee_id', employeeId)
    .in('holiday_id', optionalIds)

  if (opted && opted.length > 0) return true

  return false
}

export function isWeeklyOff(shift: ShiftInfo, date: string): boolean {
  const dt = new Date(date + 'T00:00:00+05:30')
  const dayOfWeek = dt.getDay()
  return shift.weekly_off_days.includes(dayOfWeek)
}
