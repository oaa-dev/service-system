import { StarRating } from './star-rating';

interface ReviewSummaryProps {
  averageRating: string | null;
  reviewCount: number;
}

export function ReviewSummary({ averageRating, reviewCount }: ReviewSummaryProps) {
  const avg = averageRating ? parseFloat(averageRating) : 0;

  if (reviewCount === 0) {
    return (
      <span className="text-sm text-muted-foreground">No reviews yet</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(avg)} size="sm" />
      <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
