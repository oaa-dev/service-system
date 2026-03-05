'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/reviews/star-rating';
import { useMyReviews, useDeleteReview } from '@/hooks/useReviews';
import { toast } from 'sonner';
import type { Review } from '@/types/api';

function ReviewCard({ review, onDelete }: { review: Review; onDelete: (id: number) => void }) {
  const merchantName = review.merchant?.name ?? 'Merchant';
  const merchantSlug = review.merchant?.slug ?? '';

  return (
    <Card className="shadow-warm border-0">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/merchants/${merchantSlug}`}
              className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1"
            >
              {merchantName}
            </Link>
            <StarRating rating={review.rating} size="sm" className="mt-1" />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/merchants/${merchantSlug}#reviews`}>Edit</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(review.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        {review.title && (
          <p className="font-medium text-sm">{review.title}</p>
        )}
        {review.comment && (
          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
        )}

        {review.merchant_reply && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Merchant reply</p>
            <p className="text-sm text-muted-foreground">{review.merchant_reply}</p>
          </div>
        )}

        {review.created_at && (
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyReviewsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyReviews({ page, per_page: 15 });
  const deleteReview = useDeleteReview('');

  const reviews = data?.data ?? [];
  const pagination = data?.meta;

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview.mutateAsync(id);
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Star className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">My Reviews</h1>
          <p className="text-sm text-muted-foreground">Reviews you&apos;ve written</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="shadow-warm border-0">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground">
            Visit a merchant&apos;s page after completing a transaction to leave a review.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/merchants">Browse merchants</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} onDelete={handleDelete} />
            ))}
          </div>

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
        </>
      )}
    </div>
  );
}
