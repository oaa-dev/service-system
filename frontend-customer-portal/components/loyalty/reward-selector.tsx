'use client';

import { useState } from 'react';
import { Gift, Percent, Tag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMyLoyaltyRewards } from '@/hooks/useLoyalty';
import type { LoyaltyReward } from '@/types/api';

interface RewardSelectorProps {
  /** Restrict rewards to a specific merchant. Highly recommended for checkout. */
  merchantId?: number;
  /** Currently applied reward id, controlled from parent. */
  selectedRewardId: number | null;
  /** Called when the user applies or removes a reward. */
  onApply: (rewardId: number | null) => void;
  className?: string;
}

function rewardIcon(type: LoyaltyReward['reward_type']) {
  if (type === 'discount_percentage') return Percent;
  if (type === 'discount_fixed') return Tag;
  return Package;
}

function rewardLabel(reward: LoyaltyReward): string {
  if (reward.reward_description) return reward.reward_description;
  if (reward.reward_type === 'discount_percentage') return `${reward.reward_value ?? '?'}% discount`;
  if (reward.reward_type === 'discount_fixed') return `₱${reward.reward_value ?? '?'} off`;
  if (reward.reward_product) return `Free: ${reward.reward_product.name}`;
  return 'Free product reward';
}

function rewardTypeBadgeVariant(type: LoyaltyReward['reward_type']): 'default' | 'secondary' | 'outline' {
  if (type === 'discount_percentage') return 'default';
  if (type === 'discount_fixed') return 'secondary';
  return 'outline';
}

export function RewardSelector({
  merchantId,
  selectedRewardId,
  onApply,
  className,
}: RewardSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useMyLoyaltyRewards(
    merchantId ? { merchant_id: merchantId, per_page: 50 } : { per_page: 50 },
  );

  const rewards = (data?.data ?? []).filter((r) => r.status === 'available');

  // If no rewards exist and the panel is closed, show nothing
  if (!isLoading && rewards.length === 0 && !open) return null;

  const selectedReward = rewards.find((r) => r.id === selectedRewardId) ?? null;

  const handleValueChange = (val: string) => {
    onApply(Number(val));
  };

  const handleRemove = () => {
    onApply(null);
    setOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Collapsed trigger / applied state */}
      {!open && selectedReward ? (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Gift className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm font-medium text-primary truncate">{rewardLabel(selectedReward)}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0 h-7" onClick={handleRemove}>
            Remove
          </Button>
        </div>
      ) : !open ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setOpen(true)}
          disabled={isLoading}
        >
          <Gift className="mr-2 h-4 w-4" />
          {isLoading ? 'Checking rewards...' : `Apply loyalty reward (${rewards.length} available)`}
        </Button>
      ) : null}

      {/* Expanded picker */}
      {open && (
        <div className="rounded-xl border border-border/60 bg-background shadow-warm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Select a reward</p>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-muted-foreground" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 2 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : rewards.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No available rewards for this merchant.
            </div>
          ) : (
            <RadioGroup
              value={selectedRewardId?.toString() ?? ''}
              onValueChange={handleValueChange}
              className="p-3 space-y-2"
            >
              {rewards.map((reward) => {
                const Icon = rewardIcon(reward.reward_type);
                const isSelected = selectedRewardId === reward.id;
                const merchantName = reward.loyalty_card?.merchant?.name ?? null;

                return (
                  <Label
                    key={reward.id}
                    htmlFor={`reward-${reward.id}`}
                    className={cn(
                      'flex items-start gap-3 cursor-pointer rounded-lg border p-3 transition-colors',
                      isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/40 hover:border-border hover:bg-muted/30',
                    )}
                  >
                    <RadioGroupItem
                      id={`reward-${reward.id}`}
                      value={reward.id.toString()}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-snug">{rewardLabel(reward)}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={rewardTypeBadgeVariant(reward.reward_type)} className="text-xs h-5">
                            {reward.reward_type === 'discount_percentage'
                              ? '% discount'
                              : reward.reward_type === 'discount_fixed'
                                ? 'Fixed discount'
                                : 'Free product'}
                          </Badge>
                          {merchantName && (
                            <span className="text-xs text-muted-foreground truncate">{merchantName}</span>
                          )}
                          {reward.expires_at && (
                            <span className="text-xs text-muted-foreground">
                              expires{' '}
                              {new Date(reward.expires_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          )}

          {/* Apply button */}
          {selectedRewardId !== null && (
            <div className="px-3 pb-3">
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Apply reward
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
