'use client';

import { use, useState, useMemo, useCallback } from 'react';
import { useMerchant } from '@/hooks/useMerchants';
import { useReservations, useUpdateReservationStatus } from '@/hooks/useReservations';
import { Reservation, ReservationStatus, ReservationQueryParams, MerchantStatus } from '@/types/api';
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
  ChevronLeft, ChevronRight, ArrowLeft, Store, CalendarDays, RefreshCw, User, DoorOpen, DoorClosed, BedDouble, Ban, Plus,
} from 'lucide-react';
import Link from 'next/link';
import { PermissionGate } from '@/components/permission-gate';
import { CreateReservationDialog } from './create-reservation-dialog';

const merchantStatusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  approved: 'bg-blue-500 hover:bg-blue-600',
  active: 'bg-emerald-500 hover:bg-emerald-600',
  rejected: 'bg-red-500 hover:bg-red-600',
  suspended: 'bg-gray-500 hover:bg-gray-600',
};

const reservationStatusColors: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  checked_in: 'bg-emerald-500',
  checked_out: 'bg-gray-500',
  cancelled: 'bg-red-500',
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

// Valid status transitions
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

export default function MerchantReservationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const merchantId = parseInt(id);
  const { data: merchantData, isLoading: merchantLoading } = useMerchant(merchantId);
  const merchant = merchantData?.data;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [statusAction, setStatusAction] = useState<{ reservation: Reservation; status: ReservationStatus } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = useMemo<ReservationQueryParams>(() => {
    const params: ReservationQueryParams = { page, per_page: perPage };
    if (filterValues.status) params['filter[status]'] = filterValues.status;
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useReservations(merchantId, queryParams);
  const statusMutation = useUpdateReservationStatus();

  const handleFilterChange = useCallback((values: FilterValues) => { setFilterValues(values); setPage(1); }, []);
  const handleFilterReset = useCallback(() => { setFilterValues({}); setPage(1); }, []);

  const handleStatusUpdate = () => {
    if (statusAction) {
      statusMutation.mutate(
        { merchantId, reservationId: statusAction.reservation.id, data: { status: statusAction.status } },
        { onSuccess: () => setStatusAction(null) }
      );
    }
  };

  if (merchantLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Merchant not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/merchants"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Merchants</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/merchants/${merchant.id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Reservations: {merchant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={merchantStatusColors[merchant.status]}>{merchant.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Reservations</CardTitle>
                <CardDescription>Manage reservations for this merchant.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <PermissionGate permission="reservations.create">
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Reservation
                  </Button>
                </PermissionGate>
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
                    <div className="flex items-center gap-2">
                      <Badge className={reservationStatusColors[reservation.status]}>{reservation.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                  {VALID_ACTIONS[reservation.status] && (
                    <PermissionGate permission="reservations.update_status">
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        {VALID_ACTIONS[reservation.status].map((action) => (
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
                      </div>
                    </PermissionGate>
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

      <CreateReservationDialog merchantId={merchantId} open={createOpen} onOpenChange={setCreateOpen} />

      {/* Status update confirmation */}
      <AlertDialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Reservation Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change reservation #{statusAction?.reservation.id} status to <span className="font-semibold">{statusAction?.status.replace(/_/g, ' ')}</span>?
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
