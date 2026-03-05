'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: false;
  className?: string;
}

interface InteractiveStarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive: true;
  onChange: (rating: number) => void;
  className?: string;
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating(props: StarRatingProps | InteractiveStarRatingProps) {
  const { rating, max = 5, size = 'md', className } = props;
  const interactive = props.interactive === true;
  const onChange = interactive ? (props as InteractiveStarRatingProps).onChange : undefined;
  const starSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-0.5', className)} role={interactive ? 'radiogroup' : undefined}>
      {Array.from({ length: max }, (_, i) => {
        const value = i + 1;
        const filled = value <= rating;
        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value === rating : undefined}
            aria-label={interactive ? `${value} star${value > 1 ? 's' : ''}` : undefined}
            disabled={!interactive}
            onClick={interactive ? () => onChange!(value) : undefined}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm',
              !interactive && 'cursor-default pointer-events-none',
            )}
          >
            <Star
              className={cn(
                starSize,
                filled ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
