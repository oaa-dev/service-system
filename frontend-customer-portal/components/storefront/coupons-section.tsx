'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Ticket, Copy, Check, Clock, LogIn, RefreshCw, Tag, Scissors, Bookmark, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useMerchantCoupons, useClaimCoupon } from '@/hooks/useStorefront';
import { useAuthStore } from '@/stores/authStore';
import type { Coupon } from '@/types/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDiscount(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') return `${parseFloat(coupon.discount_value).toFixed(0)}% OFF`;
  if (coupon.discount_type === 'fixed') return `₱${parseFloat(coupon.discount_value).toFixed(0)} OFF`;
  return 'FREE PRODUCT';
}

const applicableLabels: Record<string, string> = {
  booking: 'Bookings',
  reservation: 'Reservations',
  sell_product: 'Orders',
};

function formatSchedule(schedule: Coupon['valid_schedule']): string | null {
  if (!schedule || !schedule.days || schedule.days.length === 0) return null;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = schedule.days.sort().map((d) => dayNames[d] ?? d);

  let dayStr: string;
  if (days.length === 7) {
    dayStr = 'Every day';
  } else if (days.length >= 3 && schedule.days.every((d, i, arr) => i === 0 || d === arr[i - 1] + 1)) {
    dayStr = `${days[0]}-${days[days.length - 1]}`;
  } else {
    dayStr = days.join(', ');
  }

  if (schedule.start_time && schedule.end_time) {
    return `${dayStr}, ${schedule.start_time} - ${schedule.end_time}`;
  }
  return dayStr;
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null | undefined): string | null {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <button
      onClick={handleCopy}
      title="Copy code"
      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

// ─── CouponCard ───────────────────────────────────────────────────────────────

function CouponCard({ coupon }: { coupon: Coupon }) {
  const { isAuthenticated } = useAuthStore();
  const claimMutation = useClaimCoupon();

  const claim = coupon.claim ?? null;
  const isClaimed = !!claim && !claim.is_expired;
  const isClaimedExpired = !!claim && claim.is_expired;
  const hasClaimExpiry = coupon.is_claimable && coupon.claim_validity_hours;
  const countdown = useCountdown(isClaimed && hasClaimExpiry ? claim?.expires_at : null);

  const discountText = formatDiscount(coupon);
  const isPercentage = coupon.discount_type === 'percentage';
  const isFixed = coupon.discount_type === 'fixed';

  const handleClaim = () => {
    claimMutation.mutate(coupon.id, {
      onSuccess: () => toast.success('Coupon saved to your account!'),
      onError: () => toast.error('Failed to claim coupon.'),
    });
  };

  const accentColor = isPercentage
    ? 'from-emerald-500 to-teal-500'
    : isFixed
      ? 'from-green-500 to-emerald-500'
      : 'from-teal-500 to-cyan-500';

  return (
    <div className="relative flex rounded-xl overflow-hidden shadow-sm border border-emerald-100 bg-white group hover:shadow-md transition-shadow duration-200">
      {/* Left accent strip */}
      <div className={`w-2 flex-shrink-0 bg-gradient-to-b ${accentColor}`} />

      {/* Ticket notch — top */}
      <div className="absolute left-2 -top-2.5 w-5 h-5 rounded-full bg-slate-50 border border-emerald-100 z-10" />
      {/* Ticket notch — bottom */}
      <div className="absolute left-2 -bottom-2.5 w-5 h-5 rounded-full bg-slate-50 border border-emerald-100 z-10" />

      {/* Main body */}
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 p-4 pl-5">
        {/* Discount display */}
        <div className="flex-shrink-0 text-center sm:text-left sm:w-24">
          <p className={`font-display font-extrabold leading-tight text-emerald-700 ${discountText.length > 8 ? 'text-lg' : 'text-xl'}`}>
            {discountText}
          </p>
          {coupon.min_order_amount && parseFloat(coupon.min_order_amount) > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Min ₱{parseFloat(coupon.min_order_amount).toFixed(0)}
            </p>
          )}
        </div>

        {/* Dashed divider */}
        <div className="hidden sm:block h-10 border-l-2 border-dashed border-emerald-200 flex-shrink-0" />
        <div className="sm:hidden w-full border-t-2 border-dashed border-emerald-200" />

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-semibold text-slate-800 text-sm leading-snug truncate">{coupon.name}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {coupon.applicable_to && coupon.applicable_to.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Tag className="h-3 w-3" />
                {coupon.applicable_to.map((t) => applicableLabels[t] ?? t).join(', ')}
              </span>
            )}
            {formatSchedule(coupon.valid_schedule) && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3 w-3" />
                {formatSchedule(coupon.valid_schedule)}
              </span>
            )}
            {coupon.expires_at && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                Until {new Date(coupon.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Right action column */}
        <div className="flex-shrink-0 flex flex-col items-end sm:items-center gap-1.5 min-w-[110px]">
          {isClaimed ? (
            // Claimed — show code + copy + optional countdown
            <div className="flex flex-col items-end sm:items-center gap-1 w-full">
              <div className="flex items-center gap-1.5 w-full justify-end sm:justify-center">
                <code className="font-mono font-bold tracking-widest text-emerald-700 text-xs bg-emerald-50 border border-dashed border-emerald-300 px-2 py-0.5 rounded">
                  {coupon.code}
                </code>
                <CopyButton code={coupon.code} />
              </div>
              {countdown && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Clock className="h-3 w-3" />
                  {countdown}
                </span>
              )}
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <Bookmark className="h-3 w-3 fill-emerald-600" />
                Saved
              </span>
            </div>
          ) : isClaimedExpired ? (
            // Expired claim — re-claim
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5 text-xs"
              onClick={handleClaim}
              disabled={claimMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Claim Again
            </Button>
          ) : !isAuthenticated ? (
            // Not logged in
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              asChild
            >
              <Link href="/login">
                <LogIn className="h-3.5 w-3.5" />
                Login to Claim
              </Link>
            </Button>
          ) : (
            // Authenticated, not yet claimed — show claim button for ALL coupons
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={handleClaim}
              disabled={claimMutation.isPending}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {claimMutation.isPending ? 'Saving...' : 'Claim Coupon'}
            </Button>
          )}

          {hasClaimExpiry && !isClaimed && isAuthenticated && !isClaimedExpired && (
            <p className="text-xs text-slate-400 text-center">
              Valid {coupon.claim_validity_hours}h after claim
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CouponsSection ───────────────────────────────────────────────────────────

export function CouponsSection({ slug }: { slug: string }) {
  const { data, isLoading } = useMerchantCoupons(slug);
  const coupons = data?.data ?? [];

  if (isLoading) return null;
  if (coupons.length === 0) return null;

  return (
    <div className="animate-fade-in delay-100 space-y-3">
      <h3 className="font-semibold flex items-center gap-2 text-sm">
        <Scissors className="h-4 w-4 text-emerald-600 -rotate-90" />
        Available Coupons
        <Badge
          variant="secondary"
          className="ml-1 bg-emerald-100 text-emerald-700 font-semibold text-xs px-2 py-0"
        >
          {coupons.length}
        </Badge>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {coupons.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} />
        ))}
      </div>
    </div>
  );
}
