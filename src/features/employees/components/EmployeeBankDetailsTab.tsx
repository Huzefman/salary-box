import { useEmployeeBankDetails } from '@/features/employees/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Props = { employeeId: string }

export function EmployeeBankDetailsTab({ employeeId }: Props) {
  const { data: bankDetails, isLoading } = useEmployeeBankDetails(employeeId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Bank Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
    )
  }

  if (!bankDetails) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Bank Details</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No bank details on file</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Bank Details</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Account Holder</span>
          <span className="font-medium">{bankDetails.account_holder_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Account Number</span>
          <span className="font-mono">XXXX{bankDetails.account_number_last4}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">IFSC Code</span>
          <span className="font-mono">{bankDetails.ifsc_code}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bank Name</span>
          <span>{bankDetails.bank_name}</span>
        </div>
      </CardContent>
    </Card>
  )
}
