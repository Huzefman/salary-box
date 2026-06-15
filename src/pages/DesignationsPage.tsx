import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Designation = Database['public']['Tables']['designations']['Row']

async function fetchDesignationsWithDepts() {
  const [deptsRes, desigsRes] = await Promise.all([
    supabase.from('departments').select('*').eq('is_active', true).order('name'),
    supabase.from('designations').select('*').order('name'),
  ])
  if (deptsRes.error) throw deptsRes.error
  if (desigsRes.error) throw desigsRes.error
  return { departments: deptsRes.data ?? [], designations: desigsRes.data ?? [] }
}

export default function DesignationsPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null)
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['designations', 'with-departments'],
    queryFn: fetchDesignationsWithDepts,
  })

  const departments = data?.departments ?? []
  const designations = data?.designations ?? []

  const createMutation = useMutation({
    mutationFn: async ({ name, department_id }: { name: string; department_id: string | null }) => {
      const { error } = await supabase.from('designations').insert({
        name,
        department_id,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations', 'with-departments'] })
      toast.success('Designation created')
      setDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, department_id }: { id: string; name: string; department_id: string | null }) => {
      const { error } = await supabase.from('designations').update({ name, department_id }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations', 'with-departments'] })
      toast.success('Designation updated')
      setDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('designations').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations', 'with-departments'] })
      toast.success('Designation deactivated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setName('')
    setDepartmentId('')
    setEditingDesig(null)
  }

  function openEdit(desig: Designation) {
    setEditingDesig(desig)
    setName(desig.name)
    setDepartmentId(desig.department_id ?? '')
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Designation name is required')

    if (editingDesig) {
      updateMutation.mutate({
        id: editingDesig.id,
        name: name.trim(),
        department_id: departmentId || null,
      })
    } else {
      createMutation.mutate({ name: name.trim(), department_id: departmentId || null })
    }
  }

  const groupedDesignations = departments.reduce<Record<string, Designation[]>>((acc, dept) => {
    acc[dept.id] = designations.filter((d) => d.department_id === dept.id && d.is_active)
    return acc
  }, {})
  const uncategorizedDesigs = designations.filter((d) => !d.department_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Designations</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Designation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDesig ? 'Edit Designation' : 'Add Designation'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Designation Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Engineer"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingDesig ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {departments.map((dept) => {
            const items = groupedDesignations[dept.id] ?? []
            if (items.length === 0) return null
            return (
              <Card key={dept.id}>
                <CardHeader>
                  <CardTitle className="text-base">{dept.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((desig) => (
                    <div
                      key={desig.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="text-sm">{desig.name}</span>
                      <div className="flex items-center gap-1">
                        {!desig.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                        <button
                          onClick={() => openEdit(desig)}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deactivateMutation.mutate(desig.id)}
                          className="text-destructive hover:text-destructive/80 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
          {uncategorizedDesigs.filter(d => d.is_active).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uncategorized</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {uncategorizedDesigs.filter(d => d.is_active).map((desig) => (
                  <div
                    key={desig.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm">{desig.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(desig)} className="text-muted-foreground hover:text-foreground p-1">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deactivateMutation.mutate(desig.id)} className="text-destructive hover:text-destructive/80 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {designations.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center col-span-full">
              No designations yet. Click "Add Designation" to create one.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
