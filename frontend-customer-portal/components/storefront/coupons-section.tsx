'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Copy, Check, Clock, LogIn, RefreshCw, Tag, Scissors, Bookmark, CalendarDays, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useMerchantCoupons, useClaimCoupon } from '@/hooks/useStorefront';
import { useAuthStore } from '@/stores/authStore';
import type { Coupon } from '@/types/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Color themes per discount type ──────────────────────────────────────────

const themes = {
  percentage: {
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    border: 'border-emerald-200/70',
    stripeAlpha: 'rgba(255,255,255,0.06)',
  },
  fixed: {
    gradient: 'from-green-600 via-green-500 to-emerald-500',
    border: 'border-green-200/70',
    stripeAlpha: 'rgba(255,255,255,0.06)',
  },
  free_product: {
    gradient: 'from-teal-600 via-teal-500 to-cyan-500',
    border: 'border-teal-200/70',
    stripeAlpha: 'rgba(255,255,255,0.06)',
  },
} as const;

// ─── CouponCard (Ticket) ─────────────────────────────────────────────────────

function CouponCard({ coupon }: { coupon: Coupon }) {
  const { isAuthenticated } = useAuthStore();
  const claimMutation = useClaimCoupon();

  const claim = coupon.claim ?? null;
  const isClaimed = !!claim && !claim.is_expired;
  const isClaimedExpired = !!claim && claim.is_expired;
  const hasClaimExpiry = coupon.is_claimable && coupon.claim_validity_hours;
  const countdown = useCountdown(isClaimed && hasClaimExpiry ? claim?.expires_at : null);

  const handleClaim = () => {
    claimMutation.mutate(coupon.id, {
      onSuccess: () => toast.success('Coupon saved to your account!'),
      onError: () => toast.error('Failed to claim coupon.'),
    });
  };

  const theme = themes[coupon.discount_type];

  return (
    <div
      className={`
        ticket-card group relative w-[296px] flex-shrink-0 flex
        rounded-xl border bg-card
        shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]
        hover:-translate-y-0.5
        transition-all duration-300 ease-out
        overflow-hidden
        ${theme.border}
      `}
    >
      {/* ── Left Stub (the tear-off discount section) ── */}
      <div className={`relative w-[90px] flex-shrink-0 bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center`}>
        {/* Diagonal stripe texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${theme.stripeAlpha} 3px, ${theme.stripeAlpha} 6px)`,
          }}
        />

        {/* Discount value */}
        <div className="relative text-center px-2">
          {coupon.discount_type === 'free_product' ? (
            <div className="space-y-1">
              <Gift className="h-7 w-7 text-white mx-auto drop-shadow-sm" />
              <p className="text-[10px] font-extrabold text-white uppercase tracking-wider leading-tight">
                Free<br />Product
              </p>
            </div>
          ) : (
            <>
              <p className="text-[26px] font-black text-white leading-none tracking-tight font-[family-name:var(--font-display)] drop-shadow-sm">
                {coupon.discount_type === 'percentage'
                  ? `${parseFloat(coupon.discount_value).toFixed(0)}%`
                  : `₱${parseFloat(coupon.discount_value).toFixed(0)}`}
              </p>
              <p className="text-[9px] font-extrabold text-white/75 uppercase tracking-[0.2em] mt-1">
                OFF
              </p>
            </>
          )}
        </div>

        {coupon.min_order_amount && parseFloat(coupon.min_order_amount) > 0 && (
          <p className="relative text-white/50 text-[7px] font-medium mt-2 text-center leading-tight tracking-wide uppercase">
            Min ₱{parseFloat(coupon.min_order_amount).toFixed(0)}
          </p>
        )}
      </div>

      {/* ── Perforation line (the tear zone) ── */}
      <div className="relative w-0 z-10">
        {/* Top notch — semicircle punched into the card edge */}
        <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-background shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]" />
        {/* Bottom notch */}
        <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-background shadow-[inset_0_-1px_2px_rgba(0,0,0,0.08)]" />
        {/* Vertical dashed tear line */}
        <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 border-l-[1.5px] border-dashed border-emerald-200/60" />
        {/* Tiny scissors icon at the top of perforation */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
          <Scissors className="h-2 w-2 text-emerald-300/80 -rotate-90" />
        </div>
      </div>

      {/* ── Right Body (details & action) ── */}
      <div className="flex-1 min-w-0 pl-4 pr-3 py-2.5 flex flex-col justify-between gap-2">
        {/* Title & meta info */}
        <div className="space-y-1.5">
          <p className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-1 font-[family-name:var(--font-display)]">
            {coupon.name}
          </p>

          <div className="flex flex-wrap items-center gap-1">
            {coupon.applicable_to && coupon.applicable_to.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-500 bg-slate-50 ring-1 ring-slate-100 px-1.5 py-[2px] rounded-md">
                <Tag className="h-2 w-2 flex-shrink-0" />
                {coupon.applicable_to.map((t) => applicableLabels[t] ?? t).join(', ')}
              </span>
            )}
            {coupon.expires_at && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 bg-slate-50 ring-1 ring-slate-100 px-1.5 py-[2px] rounded-md">
                <Clock className="h-2 w-2 flex-shrink-0" />
                {new Date(coupon.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {formatSchedule(coupon.valid_schedule) && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 bg-slate-50 ring-1 ring-slate-100 px-1.5 py-[2px] rounded-md">
                <CalendarDays className="h-2 w-2 flex-shrink-0" />
                {formatSchedule(coupon.valid_schedule)}
              </span>
            )}
          </div>
        </div>

        {/* Action area */}
        <div>
          {isClaimed ? (
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <code className="font-mono font-bold tracking-wider text-emerald-700 text-[11px] bg-emerald-50/80 border border-dashed border-emerald-200 px-1.5 py-0.5 rounded truncate">
                  {coupon.code}
                </code>
                <CopyButton code={coupon.code} />
              </div>
              {countdown ? (
                <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5 flex-shrink-0">
                  <Clock className="h-2.5 w-2.5" />
                  {countdown}
                </span>
              ) : (
                <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5 flex-shrink-0">
                  <Bookmark className="h-2.5 w-2.5 fill-emerald-600" />
                  Saved
                </span>
              )}
            </div>
          ) : isClaimedExpired ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1 text-[11px] h-7 rounded-lg font-semibold"
              onClick={handleClaim}
              disabled={claimMutation.isPending}
            >
              <RefreshCw className="h-3 w-3" />
              Claim Again
            </Button>
          ) : !isAuthenticated ? (
            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px] h-7 rounded-lg font-semibold shadow-sm" asChild>
              <Link href="/login">
                <LogIn className="h-3 w-3" />
                Login to Claim
              </Link>
            </Button>
          ) : (
            <div className="space-y-0.5">
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px] h-7 rounded-lg font-semibold shadow-sm"
                onClick={handleClaim}
                disabled={claimMutation.isPending}
              >
                <Scissors className="h-3 w-3 -rotate-90" />
                {claimMutation.isPending ? 'Saving...' : 'Claim Coupon'}
              </Button>
              {hasClaimExpiry && (
                <p className="text-[8px] text-slate-400 text-center tracking-wide">
                  Valid {coupon.claim_validity_hours}h after claim
                </p>
              )}
            </div>
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [coupons.length, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -312 : 312, behavior: 'smooth' });
  };

  if (isLoading) return null;
  if (coupons.length === 0) return null;

  return (
    <div className="animate-fade-in delay-100 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <Scissors className="h-4 w-4 text-emerald-600 -rotate-90" />
          Available Coupons
          <span className="ml-1 bg-emerald-100 text-emerald-700 font-semibold text-[10px] px-1.5 py-0.5 rounded-full">
            {coupons.length}
          </span>
        </h3>

        {/* Arrows */}
        {coupons.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-warm-200/40 bg-card text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-default transition-colors"
              aria-label="Scroll coupons left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-warm-200/40 bg-card text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-default transition-colors"
              aria-label="Scroll coupons right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable row */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-none py-1"
        >
          {coupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      </div>
    </div>
  );
}
