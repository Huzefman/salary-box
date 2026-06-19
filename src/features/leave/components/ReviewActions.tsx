import { useState } from 'react'
import { useReviewLeave } from '../mutations'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Props = { applicationId: string }

export function ReviewActions({ applicationId }: Props) {
  const reviewLeave = useReviewLeave()

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveComment, setApproveComment] = useState('')
  const [rejectComment, setRejectComment] = useState('')

  const handleReview = async (action: 'approve' | 'reject', comment: string) => {
    try {
      await reviewLeave.mutateAsync({
        application_id: applicationId,
        action,
        comment: comment || undefined,
      })
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'}`)
      setApproveOpen(false)
      setRejectOpen(false)
      setApproveComment('')
      setRejectComment('')
    } catch (e: unknown) {
      const err = e as { message?: string }
      toast.error(err?.message ?? 'Review failed')
    }
  }

  return (
    <div className="flex gap-2">
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogTrigger asChild>
          <Button>Approve</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="approve-comment">Comment (optional)</Label>
            <Textarea
              id="approve-comment"
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="Add a comment..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleReview('approve', approveComment)}
              disabled={reviewLeave.isPending}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Reject</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reject-comment">Comment (optional)</Label>
            <Textarea
              id="reject-comment"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Add a comment..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('reject', rejectComment)}
              disabled={reviewLeave.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
