import { LeaveBalanceReport } from '@/features/leave/components/LeaveBalanceReport'

export default function ReportsLeavePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leave Balance Report</h1>
      <LeaveBalanceReport />
    </div>
  )
}
