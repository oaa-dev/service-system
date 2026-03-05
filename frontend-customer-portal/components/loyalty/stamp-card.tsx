'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LoyaltyCard } from '@/types/api';

interface StampCardProps {
  card: LoyaltyCard;
  /** Highlight a newly earned stamp index (0-based). Used on the scan success page. */
  newStampIndex?: number;
  className?: string;
}

function rewardTypeLabel(type: string, value: string | null): string {
  if (type === 'discount_percentage') return `${value ?? '?'}% off`;
  if (type === 'discount_fixed') return `₱${value ?? '?'} off`;
  return 'Free product';
}

export function StampCard({ card, newStampIndex, className }: StampCardProps) {
  const program = card.loyalty_program;
  const required = program?.required_stamps ?? 0;
  const current = Math.min(card.current_stamps, required);
  const progressPct = required > 0 ? Math.round((current / required) * 100) : 0;

  // Build an array of slot indices so we can render exactly `required` circles
  const slots = Array.from({ length: required }, (_, i) => i);

  const merchantName = card.merchant?.name ?? 'Merchant';
  const logoUrl = card.merchant?.logo ?? null;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/40 shadow-warm',
        'bg-gradient-to-br from-primary/5 via-background to-primary/10',
        className,
      )}
    >
      {/* Decorative background circle */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/8"
        aria-hidden="true"
      />

      <div className="relative p-5 space-y-4">
        {/* Header: logo + merchant + program name */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={merchantName}
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-border/30 shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
              {merchantName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-0.5 truncate">{merchantName}</p>
            <p className="font-semibold text-sm leading-tight truncate">
              {program?.name ?? 'Loyalty Card'}
            </p>
          </div>
          <div className="ml-auto shrink-0">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {current}/{required}
            </span>
          </div>
        </div>

        {/* Stamp grid */}
        {required > 0 && (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(required, 8)}, minmax(0, 1fr))` }}
            role="img"
            aria-label={`${current} of ${required} stamps collected`}
          >
            {slots.map((i) => {
              const filled = i < current;
              const isNew = newStampIndex !== undefined && i === newStampIndex;
              return (
                <div key={i} className="flex items-center justify-center">
                  {filled ? (
                    <CheckCircle2
                      className={cn(
                        'h-7 w-7 text-primary transition-transform',
                        isNew && 'scale-125 animate-bounce text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]',
                      )}
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className="h-7 w-7 text-muted-foreground/30"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={current}
              aria-valuemin={0}
              aria-valuemax={required}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {current} of {required} stamps
            </p>
            {program?.tiers && program.tiers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {program.tiers.length === 1 ? 'Reward' : 'Rewards'}:{' '}
                <span className="font-medium text-foreground">
                  {program.tiers.map((t) =>
                    t.reward_description ?? rewardTypeLabel(t.reward_type, t.reward_value)
                  ).join(', ')}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
