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
import { Loader2, Plus, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Department = Database['public']['Tables']['departments']['Row']

async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('depth')
    .order('name')
  if (error) throw error
  return data ?? []
}

function DepartmentTree({
  departments,
  parentId = null,
  depth = 0,
  onEdit,
  onDelete,
}: {
  departments: Department[]
  parentId: string | null
  depth: number
  onEdit: (dept: Department) => void
  onDelete: (id: string) => void
}) {
  const children = departments.filter((d) => d.parent_id === parentId)
  if (children.length === 0) return null

  return (
    <div className={depth > 0 ? 'ml-6 border-l pl-4' : ''}>
      {children.map((dept) => (
        <DepartmentRow
          key={dept.id}
          department={dept}
          departments={departments}
          depth={depth}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function DepartmentRow({
  department,
  departments,
  depth,
  onEdit,
  onDelete,
}: {
  department: Department
  departments: Department[]
  depth: number
  onEdit: (dept: Department) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = departments.some((d) => d.parent_id === department.id)

  return (
    <div className="py-1">
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 group">
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        <span className="flex-1 text-sm font-medium">{department.name}</span>
        <Badge variant="outline" className="text-xs">
          L{depth}
        </Badge>
        {!department.is_active && (
          <Badge variant="secondary" className="text-xs">Inactive</Badge>
        )}
        <button
          onClick={() => onEdit(department)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(department.id)}
          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && (
        <DepartmentTree
          departments={departments}
          parentId={department.id}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

export default function DepartmentsPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [selectedParent, setSelectedParent] = useState<string>('')

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments', 'tree'],
    queryFn: fetchDepartments,
  })

  const createMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId: string | null }) => {
      const parent = parentId ? departments.find((d) => d.id === parentId) : null
      const depth = parent ? parent.depth + 1 : 0
      if (depth > 2) throw new Error('Maximum department nesting depth (3 levels) reached.')

      const { error } = await supabase.from('departments').insert({
        name,
        parent_id: parentId,
        depth,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', 'tree'] })
      toast.success('Department created')
      setDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('departments').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', 'tree'] })
      toast.success('Department updated')
      setDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', 'tree'] })
      toast.success('Department deactivated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setName('')
    setSelectedParent('')
    setEditingDept(null)
  }

  function openEdit(dept: Department) {
    setEditingDept(dept)
    setName(dept.name)
    setSelectedParent(dept.parent_id ?? '')
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Department name is required')

    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, name: name.trim() })
    } else {
      createMutation.mutate({ name: name.trim(), parentId: selectedParent || null })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Departments</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engineering"
                  autoFocus
                />
              </div>
              {!editingDept && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent Department (optional)</label>
                  <select
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">None (Root Department)</option>
                    {departments.filter(d => d.is_active && d.depth < 2).map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {'—'.repeat(dept.depth + 1)} {dept.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Maximum 3 levels of nesting (L0 → L1 → L2)</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingDept ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No departments yet. Click "Add Department" to create one.
            </p>
          ) : (
            <DepartmentTree
              departments={departments}
              parentId={null}
              depth={0}
              onEdit={openEdit}
              onDelete={(id) => deactivateMutation.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
