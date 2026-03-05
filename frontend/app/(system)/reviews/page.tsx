'use client';

import { useState } from 'react';
import { Star, MessageSquare, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useReviews, useToggleReviewPublish, useUpdateReviewNotes } from '@/hooks/useReviews';
import { toast } from 'sonner';
import type { Review, ReviewQueryParams } from '@/types/api';

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

function NotesDialog({
  review,
  open,
  onClose,
}: {
  review: Review;
  open: boolean;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(review.admin_notes ?? '');
  const updateNotes = useUpdateReviewNotes();

  const handleSave = async () => {
    try {
      await updateNotes.mutateAsync({ reviewId: review.id, adminNotes: notes });
      toast.success('Notes saved');
      onClose();
    } catch {
      toast.error('Failed to save notes');
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Notes</DialogTitle>
        </DialogHeader>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Internal notes about this review..."
          rows={5}
          maxLength={5000}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateNotes.isPending}>
            {updateNotes.isPending ? 'Saving…' : 'Save notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [isPublishedFilter, setIsPublishedFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [notesReview, setNotesReview] = useState<Review | null>(null);

  const togglePublish = useToggleReviewPublish();

  const params: ReviewQueryParams = { page, per_page: 15 };
  if (isPublishedFilter !== 'all') params.is_published = isPublishedFilter === 'published';
  if (ratingFilter !== 'all') params.rating = parseInt(ratingFilter);

  const { data, isLoading } = useReviews(params);
  const reviews = data?.data ?? [];
  const pagination = data?.meta;

  const handleTogglePublish = async (review: Review) => {
    try {
      await togglePublish.mutateAsync(review.id);
      toast.success(review.is_published ? 'Review unpublished' : 'Review published');
    } catch {
      toast.error('Failed to update review');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Moderate customer reviews across all merchants</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={isPublishedFilter} onValueChange={val => { setIsPublishedFilter(val); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="unpublished">Unpublished</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={val => { setRatingFilter(val); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map(r => (
              <SelectItem key={r} value={String(r)}>{r} ★</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>No reviews found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarDisplay rating={review.rating} />
                      <Badge variant={review.is_published ? 'default' : 'secondary'} className="text-xs">
                        {review.is_published ? 'Published' : 'Unpublished'}
                      </Badge>
                      {review.is_verified && (
                        <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300 bg-emerald-50">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {review.merchant && (
                        <span className="font-medium">{review.merchant.name}</span>
                      )}
                      {review.customer && (
                        <> · {review.customer.name}</>
                      )}
                      {review.created_at && (
                        <> · {new Date(review.created_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => setNotesReview(review)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Notes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleTogglePublish(review)}
                      disabled={togglePublish.isPending}
                    >
                      {review.is_published ? (
                        <><EyeOff className="h-3.5 w-3.5" />Unpublish</>
                      ) : (
                        <><Eye className="h-3.5 w-3.5" />Publish</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.title && <p className="font-medium text-sm">{review.title}</p>}
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                {review.merchant_reply && (
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Merchant reply:</p>
                    <p className="text-sm text-muted-foreground">{review.merchant_reply}</p>
                  </div>
                )}
                {review.admin_notes && (
                  <div className="bg-amber-50 border border-amber-200/60 rounded-md p-2">
                    <p className="text-xs font-medium text-amber-700 mb-1">Admin notes:</p>
                    <p className="text-sm text-amber-800">{review.admin_notes}</p>
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

      {notesReview && (
        <NotesDialog
          review={notesReview}
          open={!!notesReview}
          onClose={() => setNotesReview(null)}
        />
      )}
    </div>
  );
}
