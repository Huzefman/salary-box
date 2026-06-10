import { useParams } from 'react-router-dom'

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Employee Detail</h1>
      <p className="text-muted-foreground">ID: {id}</p>
      {/* TODO: M2 — EmployeeDetailTabs component */}
    </div>
  )
}
