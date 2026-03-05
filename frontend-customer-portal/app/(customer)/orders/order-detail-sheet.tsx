'use client';

import { format } from 'date-fns';
import { Package, Hash, Store, MapPin, StickyNote, Loader2, Clock, ShoppingBag, CreditCard, ExternalLink } from 'lucide-react';
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
import { useMyOrder, useCancelOrder } from '@/hooks/useCustomerDashboard';
import { formatPrice } from '@/lib/storefront-utils';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ReviewForm } from '@/components/reviews/review-form';
import { useMyReviews } from '@/hooks/useReviews';
import type { ServiceOrderStatus } from '@/types/api';

interface OrderDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number | null;
}

function getStatusVariant(status: ServiceOrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'received':
    case 'processing':
    case 'ready':
    case 'delivering':
      return 'default';
    case 'completed':
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

function getStatusClassName(status: ServiceOrderStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200';
    case 'received':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
    case 'processing':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200';
    case 'ready':
      return 'bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200';
    case 'delivering':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
    default:
      return '';
  }
}

export default function OrderDetailSheet({ open, onOpenChange, itemId }: OrderDetailSheetProps) {
  const { data: response, isLoading } = useMyOrder(itemId);
  const cancelOrder = useCancelOrder();
  const { data: myReviews } = useMyReviews({ per_page: 100 });

  const order = response?.data;

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm(`Are you sure you want to cancel order "${order.order_number}"?`)) {
      return;
    }

    try {
      await cancelOrder.mutateAsync(order.id);
      toast.success('Order cancelled successfully');
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  const canCancel = order && order.status === 'pending';
  const merchant = order?.merchant;
  const quantity = order ? Number(order.quantity) : 0;
  const canReview = order?.status === 'completed';
  const existingReview = merchant
    ? myReviews?.data?.find(r => r.merchant_id === merchant.id)
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="font-[family-name:var(--font-display)]">Order Details</SheetTitle>
          <SheetDescription>View your order information</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 pb-6 space-y-6">
            {isLoading || !order ? (
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
                {/* Product Image */}
                {order.service?.image?.preview && (
                  <div className="relative h-[200px] w-full overflow-hidden rounded-lg">
                    <img
                      src={order.service.image.preview}
                      alt={order.service.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Product Info + Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold font-[family-name:var(--font-display)]">
                        {order.service?.name || 'Product'}
                      </h3>
                      {order.service?.service_category?.name && (
                        <p className="text-sm text-muted-foreground">{order.service.service_category.name}</p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(order.status)} className={getStatusClassName(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Order Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Order Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{order.order_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {quantity} {order.unit_label || 'unit'}{quantity !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span>Ordered on {format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    {order.estimated_completion && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Est. completion: {format(new Date(order.estimated_completion), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pricing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatPrice(order.unit_price)} x {quantity} {order.unit_label || 'unit'}{quantity !== 1 ? 's' : ''}
                      </span>
                      <span>{formatPrice(order.total_price)}</span>
                    </div>
                    {Number(order.discount_amount) > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Loyalty discount</span>
                        <span>-{formatPrice(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform fee ({Number(order.fee_rate)}%)</span>
                      <span>{formatPrice(order.fee_amount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="font-[family-name:var(--font-display)]">{formatPrice(order.total_amount)}</span>
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
                      <Badge className={getPaymentStatusClassName(order.payment_status ?? 'unpaid')}>
                        {(order.payment_status ?? 'unpaid').replace('_', ' ')}
                      </Badge>
                    </div>
                    {order.payment?.paid_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Paid on</span>
                        <span>{format(new Date(order.payment.paid_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    )}
                    {order.payment?.payment_method && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Method</span>
                        <span className="capitalize">{order.payment.payment_method.replace('_', ' ')}</span>
                      </div>
                    )}
                    {order.payment?.amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount paid</span>
                        <span>{formatPrice(order.payment.amount)}</span>
                      </div>
                    )}
                    {order.payment?.checkout_url && order.payment.status === 'pending' && !order.payment.is_expired && (
                      <Button
                        asChild
                        className="w-full rounded-full mt-2"
                        size="sm"
                      >
                        <a href={order.payment.checkout_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Pay Now
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notes</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{order.notes}</p>
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
                          mapId="order-detail-map"
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
                      disabled={cancelOrder.isPending}
                    >
                      {cancelOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cancel Order
                    </Button>
                  </>
                )}

                {/* Chat with Merchant */}
                {order.status !== 'cancelled' && (
                  <>
                    <Separator />
                    <ChatPanel type="orders" id={order.id} />
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
