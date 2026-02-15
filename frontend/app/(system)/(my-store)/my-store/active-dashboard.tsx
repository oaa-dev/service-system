'use client';

import { merchantStatusLabels, MerchantStatus } from '@/types/api';
import { useAuthStore } from '@/stores/authStore';
import { useMyMerchantStats } from '@/hooks/useMyMerchant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardList,
  CalendarClock,
  CalendarDays,
  Package,
  CheckCircle2,
  Clock,
  Store,
} from 'lucide-react';

export function ActiveDashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useMyMerchantStats();
  const merchant = user?.merchant;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'checked_out':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'outline';
      case 'processing':
      case 'checked_in':
        return 'secondary';
      case 'rejected':
      case 'cancelled':
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'checked_out':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'confirmed':
        return 'text-blue-600 dark:text-blue-400';
      case 'processing':
        return 'text-orange-600 dark:text-orange-400';
      case 'checked_in':
        return 'text-purple-600 dark:text-purple-400';
      case 'rejected':
      case 'cancelled':
      case 'suspended':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Store className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            {merchant?.name || 'My Store'}
          </h1>
          {merchant?.status && (
            <Badge variant={getStatusBadgeVariant(merchant.status)}>
              {merchantStatusLabels[merchant.status as MerchantStatus] || merchant.status}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your store performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.services.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.services.active ?? 0} active
            </p>
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.services.active ?? 0}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>

        {/* Bookings - Conditionally shown */}
        {merchant?.can_take_bookings && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.bookings?.today ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.bookings?.pending ?? 0} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.bookings?.pending ?? 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Orders - Conditionally shown */}
        {merchant?.can_sell_products && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Orders</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.orders?.today ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.orders?.pending ?? 0} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.orders?.pending ?? 0}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Reservations - Conditionally shown */}
        {merchant?.can_rent_units && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Reservations</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.reservations?.today ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.reservations?.pending ?? 0} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reservations</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.reservations?.pending ?? 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity */}
      {(merchant?.can_take_bookings || merchant?.can_sell_products || merchant?.can_rent_units) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest bookings, orders, and reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={
                merchant?.can_take_bookings
                  ? 'bookings'
                  : merchant?.can_sell_products
                  ? 'orders'
                  : 'reservations'
              }
              className="w-full"
            >
              <TabsList
                className={`grid w-full ${
                  [
                    merchant?.can_take_bookings,
                    merchant?.can_sell_products,
                    merchant?.can_rent_units,
                  ].filter(Boolean).length === 3
                    ? 'grid-cols-3'
                    : [
                        merchant?.can_take_bookings,
                        merchant?.can_sell_products,
                        merchant?.can_rent_units,
                      ].filter(Boolean).length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {merchant?.can_take_bookings && (
                  <TabsTrigger value="bookings">Bookings</TabsTrigger>
                )}
                {merchant?.can_sell_products && (
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                )}
                {merchant?.can_rent_units && (
                  <TabsTrigger value="reservations">Reservations</TabsTrigger>
                )}
              </TabsList>

            {/* Bookings Tab */}
            {merchant?.can_take_bookings && (
              <TabsContent value="bookings" className="space-y-4">
                {stats?.recent_bookings && stats.recent_bookings.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{booking.service?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.customer?.name} • {booking.booking_date} at{' '}
                            {booking.start_time}
                          </p>
                        </div>
                        <Badge
                          variant={getStatusBadgeVariant(booking.status)}
                          className={getStatusColor(booking.status)}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent bookings
                  </div>
                )}
              </TabsContent>
            )}

            {/* Orders Tab */}
            {merchant?.can_sell_products && (
              <TabsContent value="orders" className="space-y-4">
                {stats?.recent_orders && stats.recent_orders.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.service?.name} • {order.customer?.name}
                          </p>
                        </div>
                        <Badge
                          variant={getStatusBadgeVariant(order.status)}
                          className={getStatusColor(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent orders
                  </div>
                )}
              </TabsContent>
            )}

            {/* Reservations Tab */}
            {merchant?.can_rent_units && (
              <TabsContent value="reservations" className="space-y-4">
                {stats?.recent_reservations && stats.recent_reservations.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{reservation.service?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.customer?.name} • Check-in: {reservation.check_in}
                          </p>
                        </div>
                        <Badge
                          variant={getStatusBadgeVariant(reservation.status)}
                          className={getStatusColor(reservation.status)}
                        >
                          {reservation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent reservations
                  </div>
                )}
              </TabsContent>
            )}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
