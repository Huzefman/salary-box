import { useState } from 'react'
import { useMyAttendance } from '@/features/attendance/hooks'
import { CheckInOutCard } from '@/features/attendance/components/CheckInOutCard'
import { AttendanceSummaryCards } from '@/features/attendance/components/AttendanceSummaryCards'
import { AttendanceCalendar } from '@/features/attendance/components/AttendanceCalendar'

export default function AttendancePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { data: records } = useMyAttendance(year, month)

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else { setMonth(month - 1) }
  }

  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else { setMonth(month + 1) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Attendance</h1>
      <CheckInOutCard />
      <AttendanceSummaryCards records={records} />
      <AttendanceCalendar
        records={records}
        year={year}
        month={month}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />
    </div>
  )
}
