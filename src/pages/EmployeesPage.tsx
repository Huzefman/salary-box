import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Search, UserPlus } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import type { Database } from '@/types/database.types'

type Employee = Database['public']['Tables']['employees']['Row']

async function fetchEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments!department_id(name),
      designation:designations!designation_id(name)
    `)
    .order('first_name')
  if (error) throw error
  return data as (Employee & { department: { name: string } | null; designation: { name: string } | null })[]
}

export default function EmployeesPage() {
  const { role, isOwner } = useRole()
  const employee = useAuthStore((s) => s.employee)
  const [search, setSearch] = useState('')

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: fetchEmployees,
  })

  // Employee role — redirect to own profile
  if (role === 'employee' && employee) {
    return <Navigate to={`/employees/${employee.id}`} replace />
  }

  const filtered = employees.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.employee_code.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.department?.name?.toLowerCase().includes(q) ||
      e.designation?.name?.toLowerCase().includes(q)
    )
  })

  function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'active': return 'default'
      case 'on_probation': return 'outline'
      case 'resigned':
      case 'terminated': return 'destructive'
      case 'future_joiner': return 'secondary'
      default: return 'outline'
    }
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      active: 'Active',
      on_probation: 'Probation',
      resigned: 'Resigned',
      terminated: 'Terminated',
      on_leave: 'On Leave',
      future_joiner: 'Future Joiner',
    }
    return labels[status] ?? status
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        {isOwner && (
          <div className="flex gap-2">
            <Link to="/employees/new">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {search ? 'No employees match your search.' : 'No employees yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Designation</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Join Date</th>
                    <th className="pb-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-3">
                        <Link to={`/employees/${e.id}`} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={e.photo_url ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {e.first_name[0]}{e.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{e.first_name} {e.last_name}</p>
                            <p className="text-xs text-muted-foreground">{e.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{e.employee_code}</td>
                      <td className="py-3">{e.department?.name ?? '—'}</td>
                      <td className="py-3">{e.designation?.name ?? '—'}</td>
                      <td className="py-3">
                        <Badge variant={getStatusVariant(e.employment_status)}>
                          {getStatusLabel(e.employment_status)}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{e.join_date}</td>
                      <td className="py-3">
                        <Link
                          to={`/employees/${e.id}`}
                          className="text-primary hover:underline text-xs"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
