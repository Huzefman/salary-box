import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react'

type IPEntry = {
  id: string
  label: string
  ip_range: string
  is_active: boolean
  created_at: string
}

async function fetchIPWhitelist(): Promise<IPEntry[]> {
  const { data, error } = await supabase
    .from('ip_whitelist')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as IPEntry[]
}

export default function IPWhitelistPage() {
  const qc = useQueryClient()
  const actor = useAuthStore((s) => s.employee)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IPEntry | null>(null)
  const [label, setLabel] = useState('')
  const [ipRange, setIpRange] = useState('')
  const [isActive, setIsActive] = useState(true)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['ip-whitelist'],
    queryFn: fetchIPWhitelist,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from('ip_whitelist')
          .update({ label, ip_range: ipRange, is_active: isActive })
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('ip_whitelist').insert({
          label,
          ip_range: ipRange,
          is_active: isActive,
          created_by: actor!.id,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ip-whitelist'] })
      toast.success(editing ? 'IP entry updated' : 'IP entry added')
      resetForm()
      setDialogOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ip_whitelist').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ip-whitelist'] })
      toast.success('IP entry removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function resetForm() {
    setLabel('')
    setIpRange('')
    setIsActive(true)
    setEditing(null)
  }

  function openEdit(entry: IPEntry) {
    setEditing(entry)
    setLabel(entry.label)
    setIpRange(entry.ip_range)
    setIsActive(entry.is_active)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">IP Whitelist</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add IP Range</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit IP Range' : 'Add IP Range'}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Office WiFi" required />
              </div>
              <div className="space-y-2">
                <Label>IP Range (CIDR)</Label>
                <Input value={ipRange} onChange={(e) => setIpRange(e.target.value)} placeholder="e.g. 192.168.1.0/24" required />
                <p className="text-xs text-muted-foreground">CIDR notation — e.g. 203.0.113.0/24 or 10.0.0.0/8</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Allowed IP Ranges</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !entries || entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No IP ranges configured. Add one to restrict check-in locations.</p>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-medium flex items-center gap-2">
                      {entry.label}
                      <Badge variant={entry.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{entry.ip_range}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deactivateMutation.mutate(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
