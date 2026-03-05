'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Gift,
  CheckCircle2,
  Clock,
  QrCode,
  Star,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StampCard } from '@/components/loyalty/stamp-card';
import { useLoyaltyCard } from '@/hooks/useLoyalty';
import type { LoyaltyReward, LoyaltyStamp } from '@/types/api';

function rewardStatusVariant(status: LoyaltyReward['status']): 'default' | 'secondary' | 'outline' {
  if (status === 'available') return 'default';
  if (status === 'redeemed') return 'secondary';
  return 'outline';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function RewardRow({ reward }: { reward: LoyaltyReward }) {
  const label =
    reward.reward_description ??
    (reward.reward_type === 'discount_percentage'
      ? `${reward.reward_value ?? '?'}% discount`
      : reward.reward_type === 'discount_fixed'
        ? `₱${reward.reward_value ?? '?'} off`
        : reward.reward_product
          ? `Free: ${reward.reward_product.name}`
          : 'Free product reward');

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            reward.status === 'available' ? 'bg-primary/10' : 'bg-muted'
          }`}
        >
          <Trophy
            className={`h-4 w-4 ${reward.status === 'available' ? 'text-primary' : 'text-muted-foreground'}`}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{label}</p>
          {reward.expires_at && reward.status === 'available' && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires {formatDate(reward.expires_at)}
            </p>
          )}
          {reward.redeemed_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Redeemed {formatDate(reward.redeemed_at)}
            </p>
          )}
        </div>
      </div>
      <Badge variant={rewardStatusVariant(reward.status)} className="shrink-0 capitalize text-xs">
        {reward.status}
      </Badge>
    </div>
  );
}

function StampRow({ stamp, index }: { stamp: LoyaltyStamp; index: number }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          stamp.expired ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        }`}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">
          {stamp.source === 'qr_scan' ? (
            <span className="flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 shrink-0" />
              QR scan
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 shrink-0" />
              Bonus stamp
            </span>
          )}
        </p>
        {stamp.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{stamp.notes}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">{formatDate(stamp.earned_at)}</p>
        {stamp.expired && (
          <p className="text-xs text-destructive mt-0.5">Expired</p>
        )}
        {stamp.expires_at && !stamp.expired && (
          <p className="text-xs text-muted-foreground mt-0.5">
            exp. {formatDate(stamp.expires_at)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoyaltyCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const cardId = Number(id);

  const { data: card, isLoading, isError } = useLoyaltyCard(Number.isFinite(cardId) ? cardId : null);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <Gift className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">Card not found</p>
        <Link
          href="/loyalty"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to my cards
        </Link>
      </div>
    );
  }

  const program = card.loyalty_program;
  const stamps = card.stamps ?? [];
  const rewards = card.rewards ?? [];
  const availableRewards = rewards.filter((r) => r.status === 'available');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/loyalty"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        My loyalty cards
      </Link>

      {/* Stamp card visual */}
      <StampCard card={card} className="animate-fade-in" />

      {/* Program summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total stamps', value: card.total_stamps_earned },
          { label: 'Rewards earned', value: card.total_rewards_earned },
          { label: 'Redeemed', value: card.total_rewards_redeemed },
        ].map(({ label, value }) => (
          <Card key={label} className="shadow-warm border-0 text-center">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available rewards callout */}
      {availableRewards.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm font-medium text-primary">
            You have {availableRewards.length} reward{availableRewards.length > 1 ? 's' : ''} ready to use!
          </p>
        </div>
      )}

      {/* Program details */}
      {program && (
        <Card className="shadow-warm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Program details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {program.description && <p>{program.description}</p>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Stamps needed</span>
              <span className="font-medium text-foreground">{program.required_stamps}</span>

              <span className="text-muted-foreground">{(program.tiers?.length ?? 0) > 1 ? 'Rewards' : 'Reward'}</span>
              <div className="space-y-0.5">
                {program.tiers?.map((tier, i) => (
                  <span key={i} className="block font-medium text-foreground">
                    {tier.required_stamps} stamps: {tier.reward_description ??
                      (tier.reward_type === 'discount_percentage'
                        ? `${tier.reward_value ?? '?'}% discount`
                        : tier.reward_type === 'discount_fixed'
                          ? `₱${tier.reward_value ?? '?'} off`
                          : 'Free product')}
                  </span>
                ))}
              </div>

              {program.stamp_expiry_days && (
                <>
                  <span className="text-muted-foreground">Stamp expiry</span>
                  <span className="font-medium text-foreground">{program.stamp_expiry_days} days</span>
                </>
              )}
              {program.reward_expiry_days && (
                <>
                  <span className="text-muted-foreground">Reward expiry</span>
                  <span className="font-medium text-foreground">{program.reward_expiry_days} days</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards history */}
      {rewards.length > 0 && (
        <Card className="shadow-warm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2">
            {rewards.map((reward) => (
              <RewardRow key={reward.id} reward={reward} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stamp history */}
      {stamps.length > 0 && (
        <Card className="shadow-warm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              Stamp history
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2">
            {stamps.map((stamp, i) => (
              <StampRow key={stamp.id} stamp={stamp} index={i} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
