'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarRating } from './star-rating';
import { useCreateReview, useUpdateReview, useDeleteReview } from '@/hooks/useReviews';
import type { Review } from '@/types/api';

interface ReviewFormProps {
  merchantId: number;
  merchantSlug: string;
  existingReview?: Review;
  onSuccess?: () => void;
}

export function ReviewForm({ merchantId, merchantSlug, existingReview, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [isEditing, setIsEditing] = useState(!existingReview);

  const createReview = useCreateReview(merchantId, merchantSlug);
  const updateReview = useUpdateReview(merchantSlug);
  const deleteReview = useDeleteReview(merchantSlug);

  const isPending = createReview.isPending || updateReview.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    const data = {
      rating,
      title: title.trim() || null,
      comment: comment.trim() || null,
    };

    if (existingReview) {
      await updateReview.mutateAsync({ reviewId: existingReview.id, data });
      setIsEditing(false);
    } else {
      await createReview.mutateAsync(data);
    }
    onSuccess?.();
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    await deleteReview.mutateAsync(existingReview.id);
    onSuccess?.();
  };

  const handleCancel = () => {
    setRating(existingReview?.rating ?? 0);
    setTitle(existingReview?.title ?? '');
    setComment(existingReview?.comment ?? '');
    setIsEditing(false);
  };

  // Show existing review (read mode)
  if (existingReview && !isEditing) {
    return (
      <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StarRating rating={existingReview.rating} size="sm" />
            <span className="text-sm font-medium text-muted-foreground">Your review</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteReview.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
        {existingReview.title && (
          <p className="font-medium text-sm">{existingReview.title}</p>
        )}
        {existingReview.comment && (
          <p className="text-sm text-muted-foreground">{existingReview.comment}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Your rating</Label>
        <StarRating
          rating={rating}
          interactive
          onChange={setRating}
          size="lg"
        />
        {rating === 0 && (
          <p className="text-xs text-muted-foreground">Click a star to rate</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-title" className="text-sm font-medium">
          Title <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={255}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-comment" className="text-sm font-medium">
          Review <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share details about your experience..."
          rows={4}
          maxLength={5000}
        />
      </div>

      {(createReview.error || updateReview.error) && (
        <p className="text-sm text-destructive">
          {(createReview.error as { response?: { data?: { message?: string } } })?.response?.data?.message
            || (updateReview.error as { response?: { data?: { message?: string } } })?.response?.data?.message
            || 'Something went wrong. Please try again.'}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={rating === 0 || isPending} className="flex-1">
          {isPending ? 'Saving…' : existingReview ? 'Update review' : 'Submit review'}
        </Button>
        {existingReview && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
