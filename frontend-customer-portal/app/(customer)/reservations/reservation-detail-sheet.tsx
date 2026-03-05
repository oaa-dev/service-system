'use client';

import { format, differenceInDays } from 'date-fns';
import { Calendar, Users, Store, MapPin, StickyNote, Loader2, Moon, MessageSquare, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyReservation, useCancelReservation } from '@/hooks/useCustomerDashboard';
import { formatPrice } from '@/lib/storefront-utils';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ReviewForm } from '@/components/reviews/review-form';
import { useMyReviews } from '@/hooks/useReviews';
import type { ReservationStatus } from '@/types/api';

interface ReservationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number | null;
}

function getStatusVariant(status: ReservationStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
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
}

function getPaymentStatusClassName(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200';
    case 'failed':
      return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
    case 'refunded':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200';
    case 'unpaid':
    default:
      return 'bg-muted text-muted-foreground hover:bg-muted border-border';
  }
}

function getStatusClassName(status: ReservationStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
    case 'checked_in':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200';
    case 'checked_out':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
    default:
      return '';
  }
}

export default function ReservationDetailSheet({ open, onOpenChange, itemId }: ReservationDetailSheetProps) {
  const { data: response, isLoading } = useMyReservation(itemId);
  const cancelReservation = useCancelReservation();
  const { data: myReviews } = useMyReviews({ per_page: 100 });

  const reservation = response?.data;

  const handleCancel = async () => {
    if (!reservation) return;
    if (!window.confirm(`Are you sure you want to cancel the reservation for "${reservation.unit?.name || 'this unit'}"?`)) {
      return;
    }

    try {
      await cancelReservation.mutateAsync(reservation.id);
      toast.success('Reservation cancelled successfully');
    } catch {
      toast.error('Failed to cancel reservation');
    }
  };

  const canCancel = reservation && (reservation.status === 'pending' || reservation.status === 'confirmed');
  const merchant = reservation?.merchant;
  const canReview = reservation?.status === 'checked_out';
  const existingReview = merchant
    ? myReviews?.data?.find(r => r.merchant_id === merchant.id)
    : undefined;

  // Calculate nights from dates (use API value if available, otherwise compute)
  const nights = reservation?.nights ?? (reservation
    ? differenceInDays(new Date(reservation.check_out), new Date(reservation.check_in))
    : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="font-[family-name:var(--font-display)]">Reservation Details</SheetTitle>
          <SheetDescription>View your reservation information</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 pb-6 space-y-6">
            {isLoading || !reservation ? (
              <div className="space-y-4 pt-4">
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                {/* Service/Unit Image */}
                {reservation.service?.image?.preview && (
                  <div className="relative h-[200px] w-full overflow-hidden rounded-lg">
                    <img
                      src={reservation.service.image.preview}
                      alt={reservation.service.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Unit + Service Info + Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold font-[family-name:var(--font-display)]">
                        {reservation.unit?.name || 'Unit'}
                      </h3>
                      {reservation.service?.name && (
                        <p className="text-sm text-muted-foreground">{reservation.service.name}</p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(reservation.status)} className={getStatusClassName(reservation.status)}>
                      {reservation.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Stay Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stay Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span>{format(new Date(reservation.check_in), 'EEE, MMM d, yyyy')}</span>
                        <span className="mx-1 text-muted-foreground">to</span>
                        <span>{format(new Date(reservation.check_out), 'EEE, MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Moon className="h-4 w-4 text-muted-foreground" />
                      <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.guest_count} {reservation.guest_count === 1 ? 'guest' : 'guests'}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatPrice(reservation.price_per_night)} x {nights} {nights === 1 ? 'night' : 'nights'}
                      </span>
                      <span>{formatPrice(reservation.total_price)}</span>
                    </div>
                    {Number(reservation.discount_amount) > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Loyalty discount</span>
                        <span>-{formatPrice(reservation.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform fee ({Number(reservation.fee_rate)}%)</span>
                      <span>{formatPrice(reservation.fee_amount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="font-[family-name:var(--font-display)]">{formatPrice(reservation.total_amount)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Status</span>
                      </div>
                      <Badge className={getPaymentStatusClassName(reservation.payment_status ?? 'unpaid')}>
                        {(reservation.payment_status ?? 'unpaid').replace('_', ' ')}
                      </Badge>
                    </div>
                    {reservation.payment?.paid_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid on</span>
                        <span>{format(new Date(reservation.payment.paid_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    )}
                    {reservation.payment?.payment_method && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="capitalize">{reservation.payment.payment_method.replace('_', ' ')}</span>
                      </div>
                    )}
                    {reservation.payment?.amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount paid</span>
                        <span>{formatPrice(reservation.payment.amount)}</span>
                      </div>
                    )}
                    {reservation.payment?.checkout_url && reservation.payment.status === 'pending' && !reservation.payment.is_expired && (
                      <Button
                        asChild
                        className="w-full rounded-full mt-2"
                        size="sm"
                      >
                        <a href={reservation.payment.checkout_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Pay Now
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {reservation.notes && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notes</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{reservation.notes}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Special Requests */}
                {reservation.special_requests && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Special Requests</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{reservation.special_requests}</p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Merchant Info */}
                {merchant && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Merchant</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{merchant.name}</span>
                    </div>
                    {merchant.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">
                          {[
                            merchant.address.street,
                            merchant.address.barangay?.name,
                            merchant.address.city?.name,
                            merchant.address.province?.name,
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Map */}
                    {merchant.address?.latitude && merchant.address?.longitude && (
                      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                        <Map
                          defaultCenter={{
                            lat: Number(merchant.address.latitude),
                            lng: Number(merchant.address.longitude),
                          }}
                          defaultZoom={15}
                          mapId="reservation-detail-map"
                          className="h-[200px] w-full rounded-lg"
                          disableDefaultUI
                          gestureHandling="cooperative"
                        >
                          <AdvancedMarker
                            position={{
                              lat: Number(merchant.address.latitude),
                              lng: Number(merchant.address.longitude),
                            }}
                          />
                        </Map>
                      </APIProvider>
                    )}
                  </div>
                )}

                {/* Cancel Button */}
                {canCancel && (
                  <>
                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full rounded-full"
                      onClick={handleCancel}
                      disabled={cancelReservation.isPending}
                    >
                      {cancelReservation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel Reservation
                    </Button>
                  </>
                )}

                {/* Chat with Merchant */}
                {reservation.status !== 'cancelled' && (
                  <>
                    <Separator />
                    <ChatPanel type="reservations" id={reservation.id} />
                  </>
                )}

                {/* Rate Your Experience */}
                {canReview && merchant && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Rate Your Experience
                      </h4>
                      <ReviewForm
                        merchantId={merchant.id}
                        merchantSlug={merchant.slug}
                        existingReview={existingReview}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
