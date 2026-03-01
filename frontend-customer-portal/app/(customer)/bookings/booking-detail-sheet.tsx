'use client';

import { format } from 'date-fns';
import { Calendar, Clock, Users, Store, MapPin, StickyNote, Loader2 } from 'lucide-react';
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
import { useMyBooking, useCancelBooking } from '@/hooks/useCustomerDashboard';
import { formatPrice } from '@/lib/storefront-utils';
import { ChatPanel } from '@/components/chat/chat-panel';
import type { BookingStatus } from '@/types/api';

interface BookingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number | null;
}

function getStatusVariant(status: BookingStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'pending':
    case 'no_show':
    default:
      return 'outline';
  }
}

function getStatusClassName(status: BookingStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
    case 'no_show':
      return 'text-muted-foreground';
    default:
      return '';
  }
}

function formatTime(timeStr: string): string {
  return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function BookingDetailSheet({ open, onOpenChange, itemId }: BookingDetailSheetProps) {
  const { data: response, isLoading } = useMyBooking(itemId!);
  const cancelBooking = useCancelBooking();

  const booking = response?.data;

  const handleCancel = async () => {
    if (!booking) return;
    if (!window.confirm(`Are you sure you want to cancel the booking for "${booking.service?.name || 'this service'}"?`)) {
      return;
    }

    try {
      await cancelBooking.mutateAsync(booking.id);
      toast.success('Booking cancelled successfully');
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const canCancel = booking && (booking.status === 'pending' || booking.status === 'confirmed');
  const merchant = booking?.merchant;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="font-[family-name:var(--font-display)]">Booking Details</SheetTitle>
          <SheetDescription>View your booking information</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 pb-6 space-y-6">
            {isLoading || !booking ? (
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
                {/* Service Image */}
                {booking.service?.image?.preview && (
                  <div className="relative h-[200px] w-full overflow-hidden rounded-lg">
                    <img
                      src={booking.service.image.preview}
                      alt={booking.service.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Service Info + Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold font-[family-name:var(--font-display)]">
                        {booking.service?.name || 'Service'}
                      </h3>
                      {booking.service?.service_category?.name && (
                        <p className="text-sm text-muted-foreground">{booking.service.service_category.name}</p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(booking.status)} className={getStatusClassName(booking.status)}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Booking Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Schedule</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service price</span>
                      <span>{formatPrice(booking.service_price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform fee ({Number(booking.fee_rate)}%)</span>
                      <span>{formatPrice(booking.fee_amount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="font-[family-name:var(--font-display)]">{formatPrice(booking.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {booking.notes && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notes</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{booking.notes}</p>
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
                          mapId="booking-detail-map"
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
                      disabled={cancelBooking.isPending}
                    >
                      {cancelBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel Booking
                    </Button>
                  </>
                )}

                {/* Chat with Merchant */}
                {booking.status !== 'cancelled' && (
                  <>
                    <Separator />
                    <ChatPanel type="bookings" id={booking.id} />
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
