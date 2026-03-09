'use client';

import Link from 'next/link';
import { useMyStats } from '@/hooks/useCustomerDashboard';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Home, ShoppingBag, ArrowRight, Store, Ticket, Heart, Gift } from 'lucide-react';
import { AdBanner } from '@/components/ad-banner';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { data, isLoading, error } = useMyStats();
  const { user } = useAuthStore();
  const stats = data?.data;
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-display)]">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome to your customer dashboard</p>
        </div>
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
          Failed to load dashboard statistics. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold font-[family-name:var(--font-display)]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your activity overview</p>
      </div>

      {/* Ad Banner */}
      <AdBanner placement="dashboard_banner" className="animate-fade-in delay-100" />

      {/* Stats row — compact horizontal cards */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up delay-100">
        {[
          {
            label: 'Bookings',
            icon: Calendar,
            total: stats?.bookings.total ?? 0,
            sub: `${stats?.bookings.upcoming ?? 0} upcoming`,
            href: '/bookings',
            accent: 'bg-primary/8 text-primary',
          },
          {
            label: 'Reservations',
            icon: Home,
            total: stats?.reservations.total ?? 0,
            sub: `${stats?.reservations.active ?? 0} active`,
            href: '/reservations',
            accent: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Orders',
            icon: ShoppingBag,
            total: stats?.orders.total ?? 0,
            sub: `${stats?.orders.active ?? 0} active`,
            href: '/orders',
            accent: 'bg-emerald-50 text-emerald-600',
          },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-xl border border-warm-200/30 bg-card p-3.5 shadow-warm hover-lift transition-all"
          >
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.accent}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/60" />
                </div>
                <p className="text-2xl font-bold font-[family-name:var(--font-display)] leading-none">
                  {item.total}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{item.sub}</p>
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mt-1.5">{item.label}</p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up delay-200">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Browse Merchants', icon: Store, href: '/merchants', color: 'text-primary' },
            { label: 'My Coupons', icon: Ticket, href: '/coupons', color: 'text-violet-600' },
            { label: 'My Favorites', icon: Heart, href: '/favorites', color: 'text-rose-500' },
            { label: 'Loyalty Cards', icon: Gift, href: '/loyalty', color: 'text-amber-600' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2.5 rounded-xl border border-warm-200/30 bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/3 transition-colors shadow-sm"
            >
              <action.icon className={`h-4 w-4 ${action.color} flex-shrink-0`} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
