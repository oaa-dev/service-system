'use client';

import Link from 'next/link';
import { useMyStats } from '@/hooks/useCustomerDashboard';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Home, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data, isLoading, error } = useMyStats();
  const { user } = useAuthStore();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your customer dashboard</p>
        </div>
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          Failed to load dashboard statistics. Please try again later.
        </div>
      </div>
    );
  }

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your activity</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Bookings Card */}
        <Card className="shadow-warm border-0 hover-lift animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold font-[family-name:var(--font-display)]">{stats?.bookings.total ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.bookings.upcoming ?? 0} upcoming
                </p>
                <Link href="/bookings">
                  <Button variant="link" size="sm" className="mt-2 px-0 text-primary hover:text-primary/80">
                    View all bookings
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reservations Card */}
        <Card className="shadow-warm border-0 hover-lift animate-fade-in-up delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservations</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Home className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold font-[family-name:var(--font-display)]">{stats?.reservations.total ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.reservations.active ?? 0} active
                </p>
                <Link href="/reservations">
                  <Button variant="link" size="sm" className="mt-2 px-0 text-primary hover:text-primary/80">
                    View all reservations
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="shadow-warm border-0 hover-lift animate-fade-in-up delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold font-[family-name:var(--font-display)]">{stats?.orders.total ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.orders.active ?? 0} active
                </p>
                <Link href="/orders">
                  <Button variant="link" size="sm" className="mt-2 px-0 text-primary hover:text-primary/80">
                    View all orders
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
