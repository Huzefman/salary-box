import { useMyLeaveBalances, useMyLeaveApplications } from '@/features/leave/hooks'
import { LeaveBalanceSummary } from '@/features/leave/components/LeaveBalanceSummary'
import { LeaveApplicationList } from '@/features/leave/components/LeaveApplicationList'
import type { LeaveBalanceDisplay } from '@/features/leave/types'
import { getAvailableBalance } from '@/features/leave/utils'
import { Skeleton } from '@/components/ui/skeleton'

export default function LeaveDashboardPage() {
  const year = new Date().getFullYear()
  const { data: balances, isLoading: balLoading } = useMyLeaveBalances(year)
  const { data: applications, isLoading: appLoading } = useMyLeaveApplications()

  const displayBalances: LeaveBalanceDisplay[] = (balances ?? []).map((b) => ({
    ...b,
    available: getAvailableBalance(b),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leave Dashboard</h1>
      {balLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <LeaveBalanceSummary balances={displayBalances} />
      )}
      {appLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <LeaveApplicationList applications={applications ?? []} />
      )}
    </div>
  )
}
