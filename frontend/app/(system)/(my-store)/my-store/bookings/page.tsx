'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBookings, useUpdateBookingStatus } from '@/hooks/useBookings';
import { Booking, BookingStatus, BookingQueryParams } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataTableFilters, type FilterField, type FilterValues,
} from '@/components/ui/data-table-filters';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft, ChevronRight, CalendarClock, RefreshCw, Check, X, UserX, CheckCircle, Plus,
} from 'lucide-react';
import { CreateBookingDialog } from '@/app/(system)/(merchants)/merchants/[id]/bookings/create-booking-dialog';

const bookingStatusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  cancelled: 'bg-gray-500',
  completed: 'bg-emerald-500',
  no_show: 'bg-red-500',
};

const filters: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search by customer...' },
  {
    key: 'status', label: 'Status', type: 'select',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' },
      { label: 'No Show', value: 'no_show' },
    ],
  },
];

const VALID_ACTIONS: Record<string, { label: string; status: BookingStatus; icon: React.ReactNode; variant?: 'default' | 'destructive' | 'outline' }[]> = {
  pending: [
    { label: 'Confirm', status: 'confirmed', icon: <Check className="mr-1 h-3 w-3" /> },
    { label: 'Cancel', status: 'cancelled', icon: <X className="mr-1 h-3 w-3" />, variant: 'destructive' },
  ],
  confirmed: [
    { label: 'Complete', status: 'completed', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
    { label: 'No Show', status: 'no_show', icon: <UserX className="mr-1 h-3 w-3" />, variant: 'outline' },
    { label: 'Cancel', status: 'cancelled', icon: <X className="mr-1 h-3 w-3" />, variant: 'destructive' },
  ],
};

export default function MyStoreBookingsPage() {
  const { user } = useAuthStore();
  const merchantId = user?.merchant?.id;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [statusAction, setStatusAction] = useState<{ booking: Booking; status: BookingStatus } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = useMemo<BookingQueryParams>(() => {
    const params: BookingQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[search]'] = filterValues.search;
    if (filterValues.status) params['filter[status]'] = filterValues.status;
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useBookings(merchantId!, queryParams);
  const statusMutation = useUpdateBookingStatus();

  const handleFilterChange = useCallback((values: FilterValues) => { setFilterValues(values); setPage(1); }, []);
  const handleFilterReset = useCallback(() => { setFilterValues({}); setPage(1); }, []);

  const handleStatusUpdate = () => {
    if (statusAction && merchantId) {
      statusMutation.mutate(
        { merchantId, bookingId: statusAction.booking.id, data: { status: statusAction.status } },
        { onSuccess: () => setStatusAction(null) }
      );
    }
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    return `${h}:${m}`;
  };

  if (!merchantId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CalendarClock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Loading your store...</p>
      </div>
    );
  }

  if (!user?.merchant?.can_take_bookings) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CalendarClock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Bookings not enabled</p>
        <p className="text-sm text-muted-foreground">Contact support to enable bookings for your store</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage your service bookings</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Bookings</CardTitle>
                <CardDescription>Track and manage customer bookings</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Booking
                </Button>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <DataTableFilters filters={filters} values={filterValues} onChange={handleFilterChange} onReset={handleFilterReset} globalSearchKey="search" globalSearchPlaceholder="Search bookings..." />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <CalendarClock className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground font-medium">No bookings found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.data?.map((booking) => (
                <div key={booking.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">#{booking.id}</span>
                        <span className="text-muted-foreground">{booking.service?.name || `Service #${booking.service_id}`}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.customer?.name || 'Unknown'} &middot; {booking.booking_date} &middot; {formatTime(booking.start_time)}-{formatTime(booking.end_time)}
                        {booking.party_size > 1 && <> &middot; {booking.party_size} guests</>}
                      </div>
                      {parseFloat(booking.service_price) > 0 && (
                        <div className="text-sm font-medium mt-1">
                          {parseFloat(booking.fee_amount) > 0 ? (
                            <>Subtotal: {booking.service_price} + Fee ({booking.fee_rate}%): {booking.fee_amount} = Total: {booking.total_amount}</>
                          ) : (
                            <>Total: {booking.service_price}</>
                          )}
                        </div>
                      )}
                      {booking.notes && <p className="text-sm text-muted-foreground mt-1">{booking.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={bookingStatusColors[booking.status]}>{booking.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  {VALID_ACTIONS[booking.status] && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {VALID_ACTIONS[booking.status].map((action) => (
                        <Button
                          key={action.status}
                          variant={action.variant || 'default'}
                          size="sm"
                          onClick={() => setStatusAction({ booking, status: action.status })}
                          disabled={statusMutation.isPending}
                        >
                          {action.icon}{action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {data?.meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">Showing <span className="font-medium">{data.meta.from || 0}</span> to <span className="font-medium">{data.meta.to || 0}</span> of <span className="font-medium">{data.meta.total}</span></p>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}><SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger><SelectContent>{[5, 10, 25, 50].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}</SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={data.meta.current_page === 1}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={data.meta.current_page === data.meta.last_page}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </Card>

      <CreateBookingDialog merchantId={merchantId} serviceMerchantId={user?.merchant?.parent_id ?? undefined} open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Booking Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change booking #{statusAction?.booking.id} status to <span className="font-semibold">{statusAction?.status.replace('_', ' ')}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate}>
              {statusMutation.isPending ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
