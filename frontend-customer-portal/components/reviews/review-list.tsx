'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarRating } from './star-rating';
import type { Review } from '@/types/api';

interface ReviewListProps {
  reviews: Review[];
  currentPage: number;
  lastPage: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function ReviewItem({ review }: { review: Review }) {
  const customerName = review.customer?.name ?? 'Customer';
  const avatar = review.customer?.avatar ?? null;

  return (
    <div className="space-y-3 py-4 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={avatar ?? undefined} alt={customerName} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(customerName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-medium text-sm">{customerName}</span>
            {review.created_at && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            )}
          </div>

          <StarRating rating={review.rating} size="sm" className="mt-1 mb-2" />

          {review.title && (
            <p className="font-semibold text-sm mb-1">{review.title}</p>
          )}
          {review.comment && (
            <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>

      {/* Merchant reply */}
      {review.merchant_reply && (
        <div className="ml-12 bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Merchant reply</span>
            {review.merchant_replied_at && (
              <span className="text-xs text-muted-foreground/70">
                · {formatDistanceToNow(new Date(review.merchant_replied_at), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{review.merchant_reply}</p>
        </div>
      )}
    </div>
  );
}

export function ReviewList({
  reviews,
  currentPage,
  lastPage,
  total,
  isLoading,
  onPageChange,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-3 py-4 border-b border-border/50">
            <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        {reviews.map(review => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground">
            {total} {total === 1 ? 'review' : 'reviews'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {currentPage} / {lastPage}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= lastPage}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
