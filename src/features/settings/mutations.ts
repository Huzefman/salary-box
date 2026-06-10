import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callEdgeFunction } from '@/lib/edge'
import { supabase } from '@/lib/supabase'

export function useUpdateAppConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { key: string; value: string }) =>
      callEdgeFunction<{ key: string; value: string }, { key: string; value: string }>(
        'update-app-config',
        body
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config', 'app'] }),
  })
}

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const { data, error } = await supabase.from('departments').insert(body).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useCreateDesignation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; department_id?: string }) => {
      const { data, error } = await supabase.from('designations').insert(body).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['designations'] }),
  })
}
