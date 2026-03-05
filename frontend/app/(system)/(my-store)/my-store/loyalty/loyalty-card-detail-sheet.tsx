'use client';

import { useState } from 'react';
import { useLoyaltyCard, useAwardBonusStamp } from '@/hooks/useLoyalty';
import type { LoyaltyCard, LoyaltyStamp, LoyaltyReward } from '@/types/api';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CreditCard,
  Gift,
  Plus,
  QrCode,
  Stamp,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// ─── Bonus Stamp Dialog ───────────────────────────────────────────────────────

interface BonusStampDialogProps {
  cardId: number;
  open: boolean;
  onClose: () => void;
}

function BonusStampDialog({ cardId, open, onClose }: BonusStampDialogProps) {
  const [notes, setNotes] = useState('');
  const awardStamp = useAwardBonusStamp();

  const handleAward = async () => {
    try {
      await awardStamp.mutateAsync({ cardId, data: { notes: notes || undefined } });
      toast.success('Bonus stamp awarded');
      setNotes('');
      onClose();
    } catch {
      toast.error('Failed to award stamp');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Award bonus stamp</DialogTitle>
          <DialogDescription>
            Manually add a stamp to this customer&apos;s loyalty card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              className="mt-1.5"
              placeholder="Reason for bonus stamp, e.g. special occasion, service recovery..."
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAward} disabled={awardStamp.isPending} className="gap-1.5">
            <Stamp className="h-4 w-4" />
            {awardStamp.isPending ? 'Awarding…' : 'Award stamp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stamp history row ────────────────────────────────────────────────────────

function StampRow({ stamp }: { stamp: LoyaltyStamp }) {
  const isBonus = stamp.source === 'bonus';

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          stamp.expired
            ? 'bg-muted text-muted-foreground'
            : isBonus
            ? 'bg-amber-500/10 text-amber-600'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {isBonus ? <Plus className="h-3.5 w-3.5" /> : <QrCode className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {isBonus ? 'Bonus stamp' : 'QR scan'}
          </span>
          <div className="flex items-center gap-1.5">
            {stamp.expired && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Expired
              </Badge>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {format(new Date(stamp.earned_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        {stamp.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{stamp.notes}</p>
        )}
        {stamp.awarded_by_user && (
          <p className="text-xs text-muted-foreground">by {stamp.awarded_by_user.name}</p>
        )}
      </div>
    </div>
  );
}

// ─── Reward history row ───────────────────────────────────────────────────────

function RewardStatusIcon({ status }: { status: LoyaltyReward['status'] }) {
  if (status === 'available') return <Star className="h-3.5 w-3.5 text-amber-500" />;
  if (status === 'redeemed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
}

function RewardRow({ reward }: { reward: LoyaltyReward }) {
  const statusColors: Record<LoyaltyReward['status'], string> = {
    available: 'bg-amber-500/10 text-amber-700',
    redeemed: 'bg-emerald-500/10 text-emerald-700',
    expired: 'bg-muted text-muted-foreground',
  };

  const rewardLabel = () => {
    if (reward.reward_type === 'free_product') return 'Free product';
    if (reward.reward_type === 'discount_percentage')
      return `${reward.reward_value}% discount`;
    return `${reward.reward_value} off`;
  };

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${statusColors[reward.status]}`}
      >
        <RewardStatusIcon status={reward.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{rewardLabel()}</span>
          <Badge
            variant="outline"
            className={`text-xs capitalize ${statusColors[reward.status]}`}
          >
            {reward.status}
          </Badge>
        </div>
        {reward.reward_description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {reward.reward_description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>Earned {format(new Date(reward.earned_at), 'MMM d, yyyy')}</span>
          {reward.redeemed_at && (
            <span>· Redeemed {format(new Date(reward.redeemed_at), 'MMM d, yyyy')}</span>
          )}
          {reward.expires_at && reward.status !== 'redeemed' && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              Expires {formatDistanceToNow(new Date(reward.expires_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

interface LoyaltyCardDetailSheetProps {
  card: LoyaltyCard | null;
  open: boolean;
  onClose: () => void;
}

export function LoyaltyCardDetailSheet({ card, open, onClose }: LoyaltyCardDetailSheetProps) {
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);

  const { data: detailCard, isLoading } = useLoyaltyCard(card?.id ?? 0);

  const displayCard = detailCard ?? card;

  const stamps = detailCard?.stamps ?? [];
  const rewards = detailCard?.rewards ?? [];
  const program = displayCard?.loyalty_program;

  const requiredStamps = program?.required_stamps ?? 10;
  const currentStamps = displayCard?.current_stamps ?? 0;
  const pct = Math.min(100, Math.round((currentStamps / requiredStamps) * 100));
  const availableRewards =
    (displayCard?.total_rewards_earned ?? 0) - (displayCard?.total_rewards_redeemed ?? 0);

  return (
    <>
      <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Loyalty Card
            </SheetTitle>
            <SheetDescription>
              {displayCard?.customer?.name ?? 'Customer'}&apos;s loyalty card
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              {isLoading && !card ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  {/* Stamp progress card */}
                  <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{program?.name ?? 'Loyalty Program'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {displayCard?.customer?.name ?? `Customer #${displayCard?.customer_id}`}
                        </p>
                      </div>
                      {availableRewards > 0 && (
                        <Badge className="gap-1">
                          <Star className="h-3 w-3" />
                          {availableRewards} reward{availableRewards !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stamps</span>
                        <span className="font-medium tabular-nums">
                          {currentStamps} / {requiredStamps}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{pct}% complete</p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Total stamps',
                        value: displayCard?.total_stamps_earned ?? 0,
                        icon: Stamp,
                      },
                      {
                        label: 'Rewards earned',
                        value: displayCard?.total_rewards_earned ?? 0,
                        icon: Gift,
                      },
                      {
                        label: 'Redeemed',
                        value: displayCard?.total_rewards_redeemed ?? 0,
                        icon: CheckCircle2,
                      },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-lg border bg-muted/20 p-3 text-center space-y-0.5"
                      >
                        <Icon className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-lg font-bold tabular-nums">{value}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Award bonus stamp */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setBonusDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Award bonus stamp
                    </Button>
                  </div>

                  <Separator />

                  {/* Stamp history */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Stamp className="h-4 w-4 text-muted-foreground" />
                      Stamp history
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {stamps.length}
                      </Badge>
                    </h3>

                    {isLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }, (_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : stamps.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No stamps yet
                      </p>
                    ) : (
                      <div className="divide-y">
                        {stamps.map((stamp) => (
                          <StampRow key={stamp.id} stamp={stamp} />
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Reward history */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      Reward history
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {rewards.length}
                      </Badge>
                    </h3>

                    {isLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }, (_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : rewards.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No rewards yet
                      </p>
                    ) : (
                      <div className="divide-y">
                        {rewards.map((reward) => (
                          <RewardRow key={reward.id} reward={reward} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {displayCard && (
        <BonusStampDialog
          cardId={displayCard.id}
          open={bonusDialogOpen}
          onClose={() => setBonusDialogOpen(false)}
        />
      )}
    </>
  );
}
