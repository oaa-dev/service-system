'use client';

import { useState } from 'react';
import { UserPlus, Copy, Check, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyReferralCodes, useMyReferrals, useMyReferralRewards } from '@/hooks/useReferrals';
import { formatPrice } from '@/lib/storefront-utils';
import type { ReferralCode, Referral, ReferralReward } from '@/types/api';

function copyToClipboard(text: string, onCopied: () => void) {
  navigator.clipboard.writeText(text).then(onCopied).catch(() => {});
}

function ReferralCodeCard({ code }: { code: ReferralCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(code.code, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const merchantName = code.referral_program?.merchant?.name ?? 'Unknown Merchant';

  return (
    <Card className="shadow-warm border-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">{merchantName}</p>
            {code.referral_program?.name && (
              <p className="text-sm font-medium mb-2">{code.referral_program.name}</p>
            )}
            <div className="flex items-center gap-2">
              <code className="text-base font-mono font-bold tracking-widest text-primary bg-primary/8 px-3 py-1 rounded-lg">
                {code.code}
              </code>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span>
            Used <strong>{code.uses_count}</strong>
            {code.max_uses !== null ? ` / ${code.max_uses}` : ''} times
          </span>
          {!code.is_active && (
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          )}
          {code.expires_at && (
            <span>
              Expires {new Date(code.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const referralStatusConfig: Record<Referral['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
};

function ReferralRow({ referral }: { referral: Referral }) {
  const config = referralStatusConfig[referral.status];
  const refereeName = referral.referee_customer?.user?.name ?? 'Unknown';
  const merchantName = referral.referral_program?.merchant?.name ?? 'Unknown Merchant';
  const programName = referral.referral_program?.name ?? '';

  return (
    <Card className="shadow-warm border-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{refereeName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {merchantName}{programName ? ` — ${programName}` : ''}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.className}`}>
            {config.label}
          </span>
        </div>

        {referral.completed_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Completed {new Date(referral.completed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        )}
        {!referral.completed_at && (
          <p className="text-xs text-muted-foreground mt-2">
            Referred {new Date(referral.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const rewardStatusConfig: Record<ReferralReward['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  available: { label: 'Available', className: 'bg-green-100 text-green-800 border-green-200' },
  redeemed: { label: 'Redeemed', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function formatRewardValue(reward: ReferralReward): string {
  if (reward.reward_type === 'percentage') {
    return `${reward.reward_value}% Discount`;
  }
  return `${formatPrice(reward.reward_value)} Discount`;
}

function RewardRow({ reward }: { reward: ReferralReward }) {
  const config = rewardStatusConfig[reward.status];
  const merchantName = reward.referral?.referral_program?.merchant?.name ?? 'Unknown Merchant';
  const programName = reward.referral?.referral_program?.name ?? '';

  return (
    <Card className="shadow-warm border-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{formatRewardValue(reward)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {merchantName}{programName ? ` — ${programName}` : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              As {reward.role}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.className}`}>
            {config.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          {reward.expires_at && reward.status !== 'redeemed' && (
            <span>
              Expires {new Date(reward.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
          {reward.redeemed_at && (
            <span>
              Redeemed {new Date(reward.redeemed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
          {!reward.expires_at && !reward.redeemed_at && (
            <span>
              Earned {new Date(reward.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CodesTab() {
  const { data, isLoading } = useMyReferralCodes();
  const codes = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">No referral codes yet</p>
        <p className="text-sm text-muted-foreground">
          Visit a merchant&apos;s page and generate a referral code to start sharing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {codes.map((code) => (
        <ReferralCodeCard key={code.id} code={code} />
      ))}
    </div>
  );
}

function ReferralsTab() {
  const { data, isLoading } = useMyReferrals();
  const referrals = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <Store className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">No referrals yet</p>
        <p className="text-sm text-muted-foreground">
          Share your referral code with friends to see them listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {referrals.map((referral) => (
        <ReferralRow key={referral.id} referral={referral} />
      ))}
    </div>
  );
}

function RewardsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyReferralRewards({ page, per_page: 15 });
  const rewards = data?.data ?? [];
  const pagination = data?.meta;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/30" />
        <p className="font-medium text-muted-foreground">No rewards yet</p>
        <p className="text-sm text-muted-foreground">
          Rewards appear here once your referrals complete their first transaction.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rewards.map((reward) => (
          <RewardRow key={reward.id} reward={reward} />
        ))}
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? 'reward' : 'rewards'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
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
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ReferralsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Referrals</h1>
          <p className="text-sm text-muted-foreground">Share codes, track referrals, and earn rewards</p>
        </div>
      </div>

      <Tabs defaultValue="codes">
        <TabsList className="w-full">
          <TabsTrigger value="codes" className="flex-1">My Codes</TabsTrigger>
          <TabsTrigger value="referrals" className="flex-1">My Referrals</TabsTrigger>
          <TabsTrigger value="rewards" className="flex-1">My Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="mt-4">
          <CodesTab />
        </TabsContent>

        <TabsContent value="referrals" className="mt-4">
          <ReferralsTab />
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <RewardsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
