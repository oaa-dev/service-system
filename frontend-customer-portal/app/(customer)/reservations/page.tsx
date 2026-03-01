'use client';

import { useState } from 'react';
import { useMyReservations, useCancelReservation } from '@/hooks/useCustomerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ReservationDetailSheet from './reservation-detail-sheet';

export default function ReservationsPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading, error } = useMyReservations({ page, per_page: 15, sort: '-check_in' });
  const cancelReservation = useCancelReservation();

  const handleCancel = async (id: number, unitName: string) => {
    if (!window.confirm(`Are you sure you want to cancel the reservation for "${unitName}"?`)) {
      return;
    }

    try {
      await cancelReservation.mutateAsync(id);
      toast.success('Reservation cancelled successfully');
    } catch {
      toast.error('Failed to cancel reservation');
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmed':
      case 'checked_in':
        return 'default';
      case 'checked_out':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  const getStatusClassName = (status: string): string => {
    if (status === 'checked_out') return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
    if (status === 'confirmed' || status === 'checked_in') return 'bg-primary text-primary-foreground';
    return '';
  };

  const canCancel = (status: string): boolean => {
    return status === 'pending' || status === 'confirmed';
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number): string => {
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">My Reservations</h1>
          <p className="text-muted-foreground">View and manage your unit reservations</p>
        </div>
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load reservations. Please try again later.</span>
        </div>
      </div>
    );
  }

  const reservations = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">My Reservations</h1>
        <p className="text-muted-foreground">View and manage your unit reservations</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="shadow-warm border-0">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <Card className="shadow-warm border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
              <Home className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">No reservations found</p>
            <p className="text-sm text-muted-foreground">Your reservation history will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reservations.map((reservation, index) => (
              <Card key={reservation.id} className="shadow-warm border-0 rounded-xl hover-lift animate-fade-in-up cursor-pointer" style={{ animationDelay: `${index * 50}ms` }} onClick={() => setSelectedId(reservation.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-[family-name:var(--font-display)]">{reservation.unit?.name || 'Unit'}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                          </span>
                        </div>
                        <span>
                          {reservation.nights} {reservation.nights === 1 ? 'night' : 'nights'}
                        </span>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(reservation.status)} className={getStatusClassName(reservation.status)}>
                      {reservation.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-semibold font-[family-name:var(--font-display)]">{formatCurrency(reservation.total_amount)}</p>
                    </div>
                    {canCancel(reservation.status) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={(e) => { e.stopPropagation(); handleCancel(reservation.id, reservation.unit?.name || 'Unit'); }}
                        disabled={cancelReservation.isPending}
                      >
                        Cancel Reservation
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {meta.from} to {meta.to} of {meta.total} reservations
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {meta.current_page} of {meta.last_page}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ReservationDetailSheet
        open={selectedId !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        itemId={selectedId}
      />
    </div>
  );
}
