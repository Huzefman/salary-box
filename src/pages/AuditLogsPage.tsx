import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

type AuditEntry = {
  id: string
  table_name: string
  action: string
  actor_name: string | null
  actor_role: string | null
  actor_system_function: string | null
  ip_address: string | null
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tableFilter, setTableFilter] = useState<string>('all')

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('id, table_name, action, actor_id, actor_role, actor_system_function, ip_address, created_at')
          .order('created_at', { ascending: false })
          .limit(100)

        if (cancelled || error) return

        const actorIds = [...new Set(data.map((l) => l.actor_id).filter((id): id is string => !!id))]
        const actorMap = new Map<string, string>()

        if (actorIds.length > 0) {
          const { data: employees } = await supabase
            .from('employees')
            .select('id, first_name, last_name')
            .in('id', actorIds)
          if (employees) {
            for (const e of employees) {
              actorMap.set(e.id, `${e.first_name} ${e.last_name}`)
            }
          }
        }

        setLogs(data.map((l) => ({
          id: l.id,
          table_name: l.table_name,
          action: l.action,
          actor_name: l.actor_id ? (actorMap.get(l.actor_id) ?? null) : null,
          actor_role: l.actor_role,
          actor_system_function: l.actor_system_function,
          ip_address: l.ip_address as string | null,
          created_at: l.created_at,
        })))
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

  const tables = [...new Set(logs.map((l) => l.table_name))].sort()
  const filtered = tableFilter === 'all' ? logs : logs.filter((l) => l.table_name === tableFilter)

  const ACTION_STYLES: Record<string, string> = {
    INSERT: 'text-green-700 bg-green-50',
    UPDATE: 'text-blue-700 bg-blue-50',
    DELETE: 'text-red-700 bg-red-50',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="All Tables" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tables.map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No audit logs found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{l.table_name.replace(/_/g, ' ')}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_STYLES[l.action] ?? ''}`}>
                          {l.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{l.actor_name ?? l.actor_system_function ?? '—'}</TableCell>
                      <TableCell className="text-sm capitalize">{l.actor_role?.replace(/_/g, ' ') ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{l.ip_address ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
