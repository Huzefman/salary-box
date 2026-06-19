import { HolidayList } from '@/features/leave/components/HolidayList'

export default function HolidayCalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Holiday Calendar</h1>
      <HolidayList />
    </div>
  )
}
