'use client';

import { useState } from 'react';
import { Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card, CardContent, CardHeader,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useMyMerchantReviews, useReplyToReview, useUpdateReply, useDeleteReply } from '@/hooks/useReviews';
import { toast } from 'sonner';
import type { Review } from '@/types/api';

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function ReplyDialog({
  review,
  open,
  onClose,
}: {
  review: Review;
  open: boolean;
  onClose: () => void;
}) {
  const [reply, setReply] = useState(review.merchant_reply ?? '');
  const replyToReview = useReplyToReview();
  const updateReply = useUpdateReply();
  const deleteReply = useDeleteReply();
  const isExisting = !!review.merchant_reply;
  const isPending = replyToReview.isPending || updateReply.isPending;

  const handleSave = async () => {
    try {
      if (isExisting) {
        await updateReply.mutateAsync({ reviewId: review.id, reply });
      } else {
        await replyToReview.mutateAsync({ reviewId: review.id, reply });
      }
      toast.success(isExisting ? 'Reply updated' : 'Reply posted');
      onClose();
    } catch {
      toast.error('Failed to save reply');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your reply?')) return;
    try {
      await deleteReply.mutateAsync(review.id);
      toast.success('Reply deleted');
      onClose();
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isExisting ? 'Edit reply' : 'Reply to review'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Show customer review for context */}
          <div className="bg-muted/50 rounded-md p-3 space-y-1">
            <StarDisplay rating={review.rating} />
            {review.title && <p className="font-medium text-sm">{review.title}</p>}
            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
          </div>
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Write your reply to this review..."
            rows={4}
            maxLength={5000}
          />
        </div>
        <DialogFooter className="gap-2">
          {isExisting && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteReply.isPending}
            >
              Delete reply
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending || !reply.trim()}>
            {isPending ? 'Saving…' : isExisting ? 'Update reply' : 'Post reply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyStoreReviewsPage() {
  const { user } = useAuthStore();
  const merchantId = user?.merchant?.id;
  const [page, setPage] = useState(1);
  const [replyReview, setReplyReview] = useState<Review | null>(null);

  const { data, isLoading } = useMyMerchantReviews({ page, per_page: 15 });
  const reviews = data?.data ?? [];
  const pagination = data?.meta;

  if (!merchantId) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Reviews</h1>
        <p className="text-sm text-muted-foreground">Reviews from your customers</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <StarDisplay rating={review.rating} />
                    <p className="text-xs text-muted-foreground">
                      {review.customer?.name ?? 'Customer'}
                      {review.created_at && (
                        <> · {new Date(review.created_at).toLocaleDateString()}</>
                      )}
                      {review.is_verified && (
                        <Badge variant="outline" className="ml-2 text-xs text-emerald-700 border-emerald-300 bg-emerald-50">
                          Verified purchase
                        </Badge>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 flex-shrink-0"
                    onClick={() => setReplyReview(review)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {review.merchant_reply ? 'Edit reply' : 'Reply'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.title && <p className="font-medium text-sm">{review.title}</p>}
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                {review.merchant_reply && (
                  <div className="bg-muted/50 rounded-md p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Your reply:</p>
                    <p className="text-sm text-muted-foreground">{review.merchant_reply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? 'review' : 'reviews'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= pagination.last_page}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {replyReview && (
        <ReplyDialog
          review={replyReview}
          open={!!replyReview}
          onClose={() => setReplyReview(null)}
        />
      )}
    </div>
  );
}
