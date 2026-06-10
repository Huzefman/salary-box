import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callEdgeFunction, callEdgeFunctionFormData } from '@/lib/edge'
import type { CreateEmployeeResponse } from '@/types'
import type { CreateEmployeeForm } from './schemas'

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEmployeeForm) =>
      callEdgeFunction<CreateEmployeeForm, CreateEmployeeResponse>('create-employee', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', 'list'] })
    },
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      callEdgeFunctionFormData<{ document_id: string; storage_path: string }>(
        'upload-document',
        formData
      ),
    onSuccess: (_data, variables) => {
      const employeeId = variables.get('employee_id') as string
      qc.invalidateQueries({ queryKey: ['employees', 'detail', employeeId] })
    },
  })
}

export function useAddLifecycleEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      callEdgeFunction<Record<string, unknown>, { event_id: string }>('add-lifecycle-event', body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['employees', 'detail', variables.employee_id as string] })
    },
  })
}
