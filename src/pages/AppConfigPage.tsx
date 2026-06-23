import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { callEdgeFunction } from '@/lib/edge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Config = Database['public']['Tables']['app_config']['Row']

async function fetchConfig(): Promise<Config[]> {
  const { data, error } = await supabase
    .from('app_config')
    .select('*')
    .order('key')
  if (error) throw error
  return data ?? []
}

export default function AppConfigPage() {
  const qc = useQueryClient()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: config = [], isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: fetchConfig,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await callEdgeFunction<{ key: string; value: string }, { key: string; value: string }>(
        'update-app-config',
        { key, value }
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app-config'] })
      toast.success('Configuration updated')
      setEditingKey(null)
    },
    onError: (err: unknown) => {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to update configuration')
    },
  })

  function startEdit(item: Config) {
    setEditingKey(item.key)
    setEditValue(item.value)
  }

  function cancelEdit() {
    setEditingKey(null)
    setEditValue('')
  }

  function handleSave(key: string) {
    if (!editValue.trim()) {
      toast.error('Value cannot be empty')
      return
    }
    updateMutation.mutate({ key, value: editValue.trim() })
  }

  function formatKey(key: string) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">App Configuration</h1>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : config.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No configuration set.</p>
          ) : (
            <div className="space-y-1">
              {config.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-4 rounded-md px-3 py-2.5 hover:bg-accent/50 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{formatKey(item.key)}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {editingKey === item.key ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-32 h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(item.key)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                        <button
                          onClick={() => handleSave(item.key)}
                          className="text-green-600 hover:text-green-700 p-1"
                          disabled={updateMutation.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{item.value}</code>
                        <button
                          onClick={() => startEdit(item)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 text-xs"
                        >
                          Edit
                        </button>
                      </>
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
