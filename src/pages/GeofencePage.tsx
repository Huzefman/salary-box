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
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Plus, Edit2, Trash2, MapPin } from 'lucide-react'
import { GeofenceMapPicker } from '@/features/attendance/components/GeofenceMapPicker'

type GeofenceEntry = {
  id: string
  label: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at: string
}

async function fetchGeofences(): Promise<GeofenceEntry[]> {
  const { data, error } = await supabase
    .from('geofence_config')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as GeofenceEntry[]
}

export default function GeofencePage() {
  const qc = useQueryClient()
  const actor = useAuthStore((s) => s.employee)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<GeofenceEntry | null>(null)
  const [label, setLabel] = useState('')
  const [latitude, setLatitude] = useState(0)
  const [longitude, setLongitude] = useState(0)
  const [radius, setRadius] = useState(100)
  const [isActive, setIsActive] = useState(true)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['geofence-config'],
    queryFn: fetchGeofences,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        label,
        latitude,
        longitude,
        radius_meters: radius,
        is_active: isActive,
      }
      if (editing) {
        const { error } = await supabase
          .from('geofence_config')
          .update(payload)
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('geofence_config').insert({
          ...payload,
          created_by: actor!.id,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofence-config'] })
      toast.success(editing ? 'Geofence updated' : 'Geofence added')
      resetForm()
      setDialogOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('geofence_config').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofence-config'] })
      toast.success('Geofence removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function resetForm() {
    setLabel('')
    setLatitude(0)
    setLongitude(0)
    setRadius(100)
    setIsActive(true)
    setEditing(null)
  }

  function openEdit(entry: GeofenceEntry) {
    setEditing(entry)
    setLabel(entry.label)
    setLatitude(entry.latitude)
    setLongitude(entry.longitude)
    setRadius(entry.radius_meters)
    setIsActive(entry.is_active)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-semibold">Geofence Configuration</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Location</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Location' : 'Add Geofence Location'}</DialogTitle>
              <DialogDescription>Click on the map to set the center, drag the marker to fine-tune. Adjust the radius with the slider below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Head Office" required />
              </div>
              <GeofenceMapPicker
                latitude={latitude}
                longitude={longitude}
                radiusMeters={radius}
                onLatitudeChange={setLatitude}
                onLongitudeChange={setLongitude}
                onRadiusChange={setRadius}
              />
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending || (!latitude && !longitude)}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Geofence Locations</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !entries || entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No geofence locations configured. Add one to restrict check-in to a physical area.</p>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="font-medium flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {entry.label}
                      <Badge variant={entry.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.latitude}, {entry.longitude} · {entry.radius_meters}m radius
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entry)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(entry.id)}>
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
