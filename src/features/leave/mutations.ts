import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callEdgeFunction } from '@/lib/edge'
import type { SubmitLeaveResponse } from '@/types'
import type { SubmitLeaveForm, ReviewLeaveForm, SubmitCompOffForm } from './schemas'

export function useSubmitLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitLeaveForm) =>
      callEdgeFunction<SubmitLeaveForm, SubmitLeaveResponse>('submit-leave', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useReviewLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ReviewLeaveForm) =>
      callEdgeFunction<ReviewLeaveForm, { application_id: string; status: string }>('review-leave', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useCancelLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { application_id: string; reason?: string }) =>
      callEdgeFunction<object, { application_id: string; status: string }>('cancel-leave', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useRequestLeaveCancellation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { application_id: string; reason?: string }) =>
      callEdgeFunction<object, { application_id: string; cancellation_requested: boolean }>(
        'request-leave-cancellation',
        body
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useConfirmLeaveCancellation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { application_id: string; action: 'confirm' | 'reject'; comment?: string }) =>
      callEdgeFunction<object, { application_id: string; status: string }>(
        'confirm-leave-cancellation',
        body
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useSubmitCompOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitCompOffForm) =>
      callEdgeFunction<SubmitCompOffForm, { request_id: string }>('submit-comp-off', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useReviewCompOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { request_id: string; action: 'approve' | 'reject'; comment?: string }) =>
      callEdgeFunction<object, { request_id: string; status: string; comp_off_expiry_date: string | null }>(
        'review-comp-off',
        body
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useOptInHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { holiday_id: string }) =>
      callEdgeFunction('opt-in-holiday', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}

export function useOptOutHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { holiday_id: string }) =>
      callEdgeFunction('opt-out-holiday', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }),
  })
}
