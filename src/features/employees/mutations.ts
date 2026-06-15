import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callEdgeFunction, callEdgeFunctionFormData } from '@/lib/edge'
import type { CreateEmployeeResponse, UploadDocumentResponse, AddLifecycleEventResponse } from '@/types'
import type { CreateEmployeeForm } from './schemas'
import type { LifecycleEventForm } from './types'

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEmployeeForm) =>
      callEdgeFunction<CreateEmployeeForm, CreateEmployeeResponse>('create-employee', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', 'list'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      callEdgeFunctionFormData<UploadDocumentResponse>('upload-document', formData),
    onSuccess: (_data, variables) => {
      const employeeId = variables.get('employee_id') as string
      qc.invalidateQueries({ queryKey: ['employees', 'documents', employeeId] })
      qc.invalidateQueries({ queryKey: ['employees', 'detail', employeeId] })
    },
  })
}

export function useAddLifecycleEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: LifecycleEventForm) =>
      callEdgeFunction<LifecycleEventForm, AddLifecycleEventResponse>('add-lifecycle-event', body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['employees', 'lifecycle', variables.employee_id] })
      qc.invalidateQueries({ queryKey: ['employees', 'detail', variables.employee_id] })
    },
  })
}
