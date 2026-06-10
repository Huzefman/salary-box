import { z } from 'zod'

export const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.string().min(1, 'Date is required'),
  year: z.number().int(),
  is_optional: z.boolean().default(false),
})
export type HolidayForm = z.infer<typeof holidaySchema>

export const shiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  weekly_off_days: z.array(z.number().min(0).max(6)).min(1, 'Select at least one weekly off day'),
  late_mark_threshold: z.number().int().min(0),
  is_default: z.boolean().default(false),
})
export type ShiftForm = z.infer<typeof shiftSchema>
