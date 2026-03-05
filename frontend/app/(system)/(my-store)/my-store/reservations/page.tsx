'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useReservations, useUpdateReservationStatus } from '@/hooks/useReservations';
import { useMarkAsPaid, useCheckPaymentStatus } from '@/hooks/usePayments';
import { Reservation, ReservationStatus, ReservationQueryParams } from '@/types/api';
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
  ChevronLeft, ChevronRight, CalendarDays, RefreshCw, User, DoorOpen, DoorClosed, BedDouble, Ban, Plus, List, CreditCard,
} from 'lucide-react';
import { CreateReservationDialog } from '@/app/(system)/(merchants)/merchants/[id]/reservations/create-reservation-dialog';
import { ReservationsCalendarView } from './reservations-calendar-view';

const reservationStatusColors: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  checked_in: 'bg-emerald-500',
  checked_out: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

const paymentStatusConfig: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive'; className?: string }> = {
  unpaid: { label: 'Unpaid', variant: 'outline' },
  pending: { label: 'Pending', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  paid: { label: 'Paid', variant: 'secondary', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  failed: { label: 'Failed', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'secondary', className: 'bg-purple-100 text-purple-800 border-purple-200' },
};

const filters: FilterField[] = [
  {
    key: 'status', label: 'Status', type: 'select',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Checked In', value: 'checked_in' },
      { label: 'Checked Out', value: 'checked_out' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
];

const VALID_ACTIONS: Record<string, { label: string; status: ReservationStatus; icon: React.ReactNode; variant?: 'default' | 'destructive' | 'outline' }[]> = {
  pending: [
    { label: 'Confirm', status: 'confirmed', icon: <BedDouble className="mr-1 h-3 w-3" /> },
    { label: 'Cancel', status: 'cancelled', icon: <Ban className="mr-1 h-3 w-3" />, variant: 'destructive' },
  ],
  confirmed: [
    { label: 'Check In', status: 'checked_in', icon: <DoorOpen className="mr-1 h-3 w-3" /> },
    { label: 'Cancel', status: 'cancelled', icon: <Ban className="mr-1 h-3 w-3" />, variant: 'destructive' },
  ],
  checked_in: [
    { label: 'Check Out', status: 'checked_out', icon: <DoorClosed className="mr-1 h-3 w-3" /> },
  ],
};

export default function MyStoreReservationsPage() {
  const { user } = useAuthStore();
  const merchantId = user?.merchant?.id;
  const isOrganization = user?.merchant?.type === 'organization';

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [statusAction, setStatusAction] = useState<{ reservation: Reservation; status: ReservationStatus } | null>(null);
  const [paymentAction, setPaymentAction] = useState<'request_payment' | 'mark_cash' | ''>('');
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = useMemo<ReservationQueryParams>(() => {
    const params: ReservationQueryParams = { page, per_page: perPage };
    if (filterValues.status) params['filter[status]'] = filterValues.status;
    if (filterValues.date_from) params['filter[date_from]'] = filterValues.date_from;
    if (filterValues.date_to) params['filter[date_to]'] = filterValues.date_to;
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useReservations(merchantId!, queryParams);
  const statusMutation = useUpdateReservationStatus();
  const markAsPaidMutation = useMarkAsPaid();
  const checkStatusMutation = useCheckPaymentStatus();

  const handleFilterChange = useCallback((values: FilterValues) => { setFilterValues(values); setPage(1); }, []);
  const handleFilterReset = useCallback(() => { setFilterValues({}); setPage(1); }, []);

  const handleDayClick = useCallback((date: string) => {
    setFilterValues((prev) => ({ ...prev, date_from: date, date_to: date }));
    setPage(1);
    setViewMode('list');
  }, []);

  const handleStatusUpdate = () => {
    if (statusAction && merchantId) {
      statusMutation.mutate(
        {
          merchantId,
          reservationId: statusAction.reservation.id,
          data: {
            status: statusAction.status,
            payment_action: paymentAction || null,
          },
        },
        {
          onSuccess: () => {
            setStatusAction(null);
            setPaymentAction('');
          },
        }
      );
    }
  };

  if (!merchantId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Loading your store...</p>
      </div>
    );
  }

  if (!user?.merchant?.can_rent_units) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Reservations not enabled</p>
        <p className="text-sm text-muted-foreground">Contact support to enable unit rentals for your store</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">Manage your rental reservations</p>
        </div>
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" /> List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-4 w-4 mr-1" /> Calendar
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Reservation Calendar</CardTitle>
            <CardDescription>Click a day to filter reservations by date</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ReservationsCalendarView
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onDayClick={handleDayClick}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === 'list' && (
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Reservations</CardTitle>
                <CardDescription>Track and manage unit reservations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Reservation
                </Button>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <DataTableFilters filters={filters} values={filterValues} onChange={handleFilterChange} onReset={handleFilterReset} />
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
              <CalendarDays className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground font-medium">No reservations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.data?.map((reservation) => (
                <div key={reservation.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">#{reservation.id}</span>
                        <span className="text-muted-foreground">{reservation.service?.name || `Service #${reservation.service_id}`}</span>
                        {isOrganization && reservation.merchant && reservation.merchant.id !== merchantId && (
                          <Badge variant="outline" className="text-xs">{reservation.merchant.name}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                        <User className="h-3 w-3" />
                        <span>{reservation.customer?.name || 'Unknown'}</span>
                        <span>&middot;</span>
                        <CalendarDays className="h-3 w-3" />
                        <span>{reservation.check_in} - {reservation.check_out}</span>
                        <span>&middot;</span>
                        <span>{reservation.nights} {reservation.nights === 1 ? 'night' : 'nights'}</span>
                        {reservation.guest_count > 1 && (
                          <>
                            <span>&middot;</span>
                            <span>{reservation.guest_count} guests</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {parseFloat(reservation.fee_amount) > 0 ? (
                          <>Subtotal: {reservation.total_price} + Fee ({reservation.fee_rate}%): {reservation.fee_amount} = Total: {reservation.total_amount}</>
                        ) : (
                          <>Total: {reservation.total_price}</>
                        )} ({reservation.price_per_night}/night)
                      </div>
                      {reservation.notes && <p className="text-sm text-muted-foreground mt-1">{reservation.notes}</p>}
                      {reservation.special_requests && <p className="text-sm text-muted-foreground mt-1 italic">{reservation.special_requests}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge className={reservationStatusColors[reservation.status]}>{reservation.status.replace(/_/g, ' ')}</Badge>
                      {reservation.payment_status && (() => {
                        const cfg = paymentStatusConfig[reservation.payment_status] ?? { label: reservation.payment_status, variant: 'outline' as const };
                        return (
                          <Badge variant={cfg.variant} className={cfg.className}>
                            <CreditCard className="h-3 w-3 mr-1" />{cfg.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                  {(VALID_ACTIONS[reservation.status] || reservation.payment?.id) && (
                    <div className="flex gap-2 mt-3 pt-3 border-t flex-wrap">
                      {VALID_ACTIONS[reservation.status]?.map((action) => (
                        <Button
                          key={action.status}
                          variant={action.variant || 'default'}
                          size="sm"
                          onClick={() => setStatusAction({ reservation, status: action.status })}
                          disabled={statusMutation.isPending}
                        >
                          {action.icon}{action.label}
                        </Button>
                      ))}
                      {reservation.payment?.id && (reservation.payment_status === 'pending' || reservation.payment_status === 'unpaid') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPaidMutation.mutate({ id: reservation.payment!.id })}
                          disabled={markAsPaidMutation.isPending}
                        >
                          <CreditCard className="mr-1 h-3 w-3" /> Mark as Paid
                        </Button>
                      )}
                      {reservation.payment?.id && reservation.payment_status === 'pending' && reservation.payment.gateway !== 'cash' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkStatusMutation.mutate({ id: reservation.payment!.id })}
                          disabled={checkStatusMutation.isPending}
                        >
                          <RefreshCw className={`mr-1 h-3 w-3 ${checkStatusMutation.isPending ? 'animate-spin' : ''}`} /> Check Status
                        </Button>
                      )}
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
      )}

      <CreateReservationDialog merchantId={merchantId} serviceMerchantId={user?.merchant?.parent_id ?? undefined} open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!statusAction} onOpenChange={(open) => { if (!open) { setStatusAction(null); setPaymentAction(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Reservation Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change reservation #{statusAction?.reservation.id} status to <span className="font-semibold">{statusAction?.status.replace(/_/g, ' ')}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {statusAction?.status === 'confirmed' && (
            <div className="py-2">
              <p className="text-sm font-medium mb-2">Payment Action</p>
              <Select value={paymentAction} onValueChange={(v) => setPaymentAction(v as typeof paymentAction)}>
                <SelectTrigger>
                  <SelectValue placeholder="No payment action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Payment Action</SelectItem>
                  <SelectItem value="request_payment">Request Online Payment</SelectItem>
                  <SelectItem value="mark_cash">Mark as Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
