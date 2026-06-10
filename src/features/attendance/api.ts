import { supabase } from '@/lib/supabase'
import type { AttendanceRecord } from '@/types'

export async function fetchMyAttendance(
  employeeId: string,
  year: number,
  month: number
): Promise<AttendanceRecord[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('date', from)
    .lte('date', to)
    .order('date')

  if (error) throw error
  return data ?? []
}

export async function fetchTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .maybeSingle()
  if (error) throw error
  return data
}
