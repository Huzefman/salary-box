import { supabase } from '@/lib/supabase'
import type { AppConfig } from '@/types'

export async function fetchAppConfig(): Promise<AppConfig[]> {
  const { data, error } = await supabase
    .from('app_config')
    .select('*')
    .order('key')
  if (error) throw error
  return data ?? []
}

export async function fetchHolidays(year: number) {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('year', year)
    .eq('is_active', true)
    .order('date')
  if (error) throw error
  return data ?? []
}
