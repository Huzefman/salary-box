import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Check, X, ClipboardList } from 'lucide-react'
import { useReviewProfileEdit } from '@/features/employees/mutations'
import type { Database } from '@/types/database.types'

type ProfileEditRequest = Database['public']['Tables']['profile_edit_requests']['Row']

const fieldLabels: Record<string, string> = {
  phone: 'Phone',
  personal_email: 'Personal Email',
  address_line1: 'Address Line 1',
  address_line2: 'Address Line 2',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
  emergency_contact_name: 'Emergency Contact',
  emergency_contact_phone: 'Emergency Phone',
}

async function fetchPendingRequests() {
  const { data, error } = await supabase
    .from('profile_edit_requests')
    .select(`
      *,
      employee:employees!employee_id(id, first_name, last_name, employee_code, photo_url)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as (ProfileEditRequest & { employee: { id: string; first_name: string; last_name: string; employee_code: string; photo_url: string | null } })[]
}

export default function ProfileEditReviewsPage() {
  const reviewEdit = useReviewProfileEdit()
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['profile-edit-requests'],
    queryFn: fetchPendingRequests,
  })

  function handleApprove(requestId: string) {
    reviewEdit.mutate(
      { request_id: requestId, action: 'approve', reviewer_notes: reviewNotes[requestId] },
      { onSuccess: () => toast.success('Request approved'), onError: (err) => toast.error((err as { message?: string }).message ?? 'Failed') }
    )
  }

  function handleReject(requestId: string) {
    reviewEdit.mutate(
      { request_id: requestId, action: 'reject', reviewer_notes: reviewNotes[requestId] },
      { onSuccess: () => toast.success('Request rejected'), onError: (err) => toast.error((err as { message?: string }).message ?? 'Failed') }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Profile Edit Requests</h1>
        <Badge variant="secondary">{requests.filter((r) => r.status === 'pending').length} pending</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No profile edit requests yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const changes = req.requested_changes as Record<string, string>
            return (
              <Card key={req.id} className={req.status !== 'pending' ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={req.employee?.photo_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {req.employee?.first_name?.[0]}{req.employee?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm">
                          {req.employee?.first_name} {req.employee?.last_name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{req.employee?.employee_code}</p>
                      </div>
                    </div>
                    <Badge variant={req.status === 'pending' ? 'default' : req.status === 'approved' ? 'secondary' : 'destructive'}>
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    {Object.entries(changes).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium min-w-28">{fieldLabels[key] ?? key}:</span>
                        <span>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requested {new Date(req.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {req.status === 'pending' && (
                    <div className="space-y-2 pt-2 border-t">
                      <Input
                        placeholder="Reviewer notes (optional)"
                        value={reviewNotes[req.id] ?? ''}
                        onChange={(e) => setReviewNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 border-green-600" disabled={reviewEdit.isPending} onClick={() => handleApprove(req.id)}>
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive" disabled={reviewEdit.isPending} onClick={() => handleReject(req.id)}>
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {req.reviewer_notes && (
                    <p className="text-xs italic text-muted-foreground">
                      Note: {req.reviewer_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
