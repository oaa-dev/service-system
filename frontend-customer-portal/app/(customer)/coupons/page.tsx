'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Ticket, Copy, Check, Clock, Tag, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useMyCoupons } from '@/hooks/useStorefront';
import type { MyCouponItem, Coupon } from '@/types/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDiscount(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') return `${parseFloat(coupon.discount_value).toFixed(0)}% OFF`;
  if (coupon.discount_type === 'fixed') return `₱${parseFloat(coupon.discount_value).toFixed(0)} OFF`;
  return 'FREE PRODUCT';
}

function formatUsedOnType(type: string | null): string {
  if (!type) return 'transaction';
  const labels: Record<string, string> = {
    booking: 'Booking',
    reservation: 'Reservation',
    sell_product: 'Order',
    service_order: 'Order',
  };
  return labels[type] ?? type;
}

function formatApplicableTo(types: string[]): string {
  return types
    .map((t) => ({ booking: 'Bookings', reservation: 'Reservations', sell_product: 'Orders' }[t] ?? t))
    .join(', ');
}

function formatSchedule(schedule: Coupon['valid_schedule']): string | null {
  if (!schedule || !schedule.days || schedule.days.length === 0) return null;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = schedule.days.sort().map((d) => dayNames[d] ?? d);

  // Compact consecutive days: Mon-Fri instead of Mon, Tue, Wed, Thu, Fri
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
    return `${days}d ${hours % 24}h remaining`;
  }
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        toast.success('Code copied!');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error('Failed to copy code'));
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return (
    <Button variant="outline" size="sm" className="flex-shrink-0 gap-1.5" onClick={handleCopy}>
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
  );
}

// ─── ActiveCouponCard ─────────────────────────────────────────────────────────

function ActiveCouponCard({ item }: { item: MyCouponItem }) {
  const { coupon } = item;
  const discountText = formatDiscount(coupon);
  const countdown = useCountdown(item.expires_at);

  return (
    <Card className="shadow-warm border-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-display)] font-extrabold text-primary text-lg">
              {discountText}
            </p>
            <p className="font-medium text-sm mt-0.5">{coupon.name}</p>
            {coupon.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{coupon.description}</p>
            )}
          </div>
          <CopyButton code={coupon.code} />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <code className="text-base font-mono font-bold tracking-widest text-primary bg-primary/8 px-3 py-1 rounded-lg">
            {coupon.code}
          </code>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
          {coupon.min_order_amount && parseFloat(coupon.min_order_amount) > 0 && (
            <span>Min ₱{parseFloat(coupon.min_order_amount).toFixed(0)}</span>
          )}
          {coupon.applicable_to && coupon.applicable_to.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {formatApplicableTo(coupon.applicable_to)}
            </span>
          )}
          {formatSchedule(coupon.valid_schedule) && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatSchedule(coupon.valid_schedule)}
            </span>
          )}
          {countdown && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Clock className="h-3 w-3" />
              {countdown}
            </span>
          )}
          {!countdown && item.expires_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires {new Date(item.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── UsedCouponCard ───────────────────────────────────────────────────────────

function UsedCouponCard({ item }: { item: MyCouponItem }) {
  const { coupon } = item;
  const discountText = formatDiscount(coupon);

  return (
    <Card className="shadow-warm border-0 opacity-75">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-display)] font-extrabold text-muted-foreground text-lg">
              {discountText}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-medium text-sm">{coupon.name}</p>
              <Badge variant="secondary" className="text-xs">Used</Badge>
            </div>
          </div>
          <code className="font-mono font-bold tracking-widest text-muted-foreground text-sm bg-muted px-2.5 py-1 rounded-md line-through flex-shrink-0">
            {coupon.code}
          </code>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
          {item.discount_amount && (
            <span className="font-semibold text-green-700">
              Saved ₱{parseFloat(item.discount_amount).toFixed(2)}
            </span>
          )}
          {item.used_on_type && item.used_on_id && (
            <span>Applied to {formatUsedOnType(item.used_on_type)} #{item.used_on_id}</span>
          )}
          {item.used_at && (
            <span>
              Used on {new Date(item.used_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ExpiredCouponCard ────────────────────────────────────────────────────────

function ExpiredCouponCard({ item }: { item: MyCouponItem }) {
  const { coupon } = item;
  const discountText = formatDiscount(coupon);

  return (
    <Card className="shadow-warm border-0 opacity-60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-[family-name:var(--font-display)] font-extrabold text-muted-foreground text-lg">
              {discountText}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-medium text-sm text-muted-foreground">{coupon.name}</p>
              <Badge variant="secondary" className="text-xs">Expired</Badge>
            </div>
          </div>
          {coupon.merchant_id && (
            <Button asChild size="sm" variant="outline" className="flex-shrink-0">
              <Link href="/merchants">Visit Store</Link>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
          {item.expires_at && (
            <span>
              Expired {new Date(item.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MyCouponCard dispatcher ──────────────────────────────────────────────────

function MyCouponCard({ item }: { item: MyCouponItem }) {
  if (item.status === 'used') return <UsedCouponCard item={item} />;
  if (item.status === 'expired') return <ExpiredCouponCard item={item} />;
  return <ActiveCouponCard item={item} />;
}

// ─── Tab content component ───────────────────────────────────────────────────

function CouponList({ items }: { items: MyCouponItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <Ticket className="h-10 w-10 mx-auto text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No coupons in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <MyCouponCard key={item.id} item={item} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyCouponsPage() {
  const { data, isLoading } = useMyCoupons();

  const allItems = data?.data ?? [];
  const activeItems = allItems.filter((i) => i.status === 'active');
  const usedItems = allItems.filter((i) => i.status === 'used');
  const expiredItems = allItems.filter((i) => i.status === 'expired');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold font-[family-name:var(--font-display)]">My Coupons</h1>
        <p className="text-sm text-muted-foreground">Your claimed and used coupons</p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allItems.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <Ticket className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No coupons yet</p>
          <p className="text-sm text-muted-foreground">Browse merchants to find coupons to claim.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/merchants">Browse merchants</Link>
          </Button>
        </div>
      )}

      {/* Coupon list with tabs */}
      {!isLoading && allItems.length > 0 && (
        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All ({allItems.length})</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Active ({activeItems.length})</TabsTrigger>
            <TabsTrigger value="used" className="flex-1">Used ({usedItems.length})</TabsTrigger>
            <TabsTrigger value="expired" className="flex-1">Expired ({expiredItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <CouponList items={allItems} />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <CouponList items={activeItems} />
          </TabsContent>

          <TabsContent value="used" className="mt-4">
            <CouponList items={usedItems} />
          </TabsContent>

          <TabsContent value="expired" className="mt-4">
            <CouponList items={expiredItems} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
