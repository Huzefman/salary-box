import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Edit2, Trash2, GripVertical } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Template = Database['public']['Tables']['onboarding_checklist_templates']['Row']

async function fetchTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('onboarding_checklist_templates')
    .select('*')
    .order('sort_order')
    .order('item_name')
  if (error) throw error
  return data ?? []
}

export default function SettingsOnboardingPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Template | null>(null)
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['onboarding-checklist'],
    queryFn: fetchTemplates,
  })

  const createMutation = useMutation({
    mutationFn: async (data: { item_name: string; description: string; is_required: boolean; sort_order: number }) => {
      const { error } = await supabase.from('onboarding_checklist_templates').insert(data)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-checklist'] })
      toast.success('Checklist item created')
      setDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; item_name: string; description: string; is_required: boolean; sort_order: number }) => {
      const { id, ...updates } = data
      const { error } = await supabase.from('onboarding_checklist_templates').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-checklist'] })
      toast.success('Checklist item updated')
      setDialogOpen(false)
      resetForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('onboarding_checklist_templates').update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-checklist'] })
      toast.success('Checklist item deactivated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('onboarding_checklist_templates').update({ is_active: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-checklist'] })
      toast.success('Checklist item reactivated')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setItemName('')
    setDescription('')
    setIsRequired(true)
    setSortOrder(0)
    setEditingItem(null)
  }

  function openEdit(item: Template) {
    setEditingItem(item)
    setItemName(item.item_name)
    setDescription(item.description ?? '')
    setIsRequired(item.is_required)
    setSortOrder(item.sort_order)
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemName.trim()) return toast.error('Item name is required')

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        item_name: itemName.trim(),
        description: description.trim(),
        is_required: isRequired,
        sort_order: sortOrder,
      })
    } else {
      createMutation.mutate({
        item_name: itemName.trim(),
        description: description.trim(),
        is_required: isRequired,
        sort_order: sortOrder,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Onboarding Checklist</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Upload ID Proof"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-desc">Description (optional)</Label>
                <Textarea
                  id="item-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what the employee needs to do"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-sort">Sort Order</Label>
                <Input
                  id="item-sort"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="item-required" checked={isRequired} onCheckedChange={setIsRequired} />
                <Label htmlFor="item-required">Required</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checklist Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No checklist items configured. Click "Add Item" to create one.
            </p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-accent/50 group"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!item.is_active ? 'text-muted-foreground line-through' : ''}`}>
                      {item.item_name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">#{item.sort_order}</Badge>
                    {item.is_required ? (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                    {!item.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                    <button
                      onClick={() => openEdit(item)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {item.is_active ? (
                      <button
                        onClick={() => deactivateMutation.mutate(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => reactivateMutation.mutate(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-green-600 hover:text-green-700 p-1 text-xs"
                      >
                        Restore
                      </button>
                    )}
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
