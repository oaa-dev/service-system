'use client';

import { useState } from 'react';
import { useMyOrders, useCancelOrder } from '@/hooks/useCustomerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Package, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import OrderDetailSheet from './order-detail-sheet';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading, error } = useMyOrders({ page, per_page: 15, sort: '-created_at' });
  const cancelOrder = useCancelOrder();

  const handleCancel = async (id: number, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to cancel order "${orderNumber}"?`)) {
      return;
    }

    try {
      await cancelOrder.mutateAsync(id);
      toast.success('Order cancelled successfully');
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmed':
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
  };

  const getStatusClassName = (status: string): string => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
    if (['confirmed', 'received', 'processing', 'ready', 'delivering'].includes(status)) return 'bg-primary text-primary-foreground';
    return '';
  };

  const getPaymentBadgeClassName = (status: string): string => {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const canCancel = (status: string): boolean => {
    return status === 'pending';
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
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">My Orders</h1>
          <p className="text-muted-foreground">View and manage your service orders</p>
        </div>
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load orders. Please try again later.</span>
        </div>
      </div>
    );
  }

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold font-[family-name:var(--font-display)]">My Orders</h1>
        <p className="text-sm text-muted-foreground">View and manage your service orders</p>
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
      ) : orders.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground">Your order history will appear here</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order, index) => (
              <Card key={order.id} className="shadow-warm border-0 rounded-xl hover-lift animate-fade-in-up cursor-pointer" style={{ animationDelay: `${index * 50}ms` }} onClick={() => setSelectedId(order.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-[family-name:var(--font-display)]">{order.service?.name || 'Product'}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Package className="h-4 w-4" />
                          <span>{order.order_number}</span>
                        </div>
                        <span>
                          {order.quantity} {order.unit_label || 'unit'}
                          {Number(order.quantity) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ordered on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(order.status)} className={getStatusClassName(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-base font-semibold font-[family-name:var(--font-display)]">{formatCurrency(order.total_amount)}</p>
                      {order.payment_status && (
                        <Badge className={`text-xs ${getPaymentBadgeClassName(order.payment_status)}`}>
                          {order.payment_status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    {canCancel(order.status) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={(e) => { e.stopPropagation(); handleCancel(order.id, order.order_number); }}
                        disabled={cancelOrder.isPending}
                      >
                        Cancel Order
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
              <p className="text-sm text-muted-foreground">
                {meta.total} {meta.total === 1 ? 'order' : 'orders'}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <OrderDetailSheet
        open={selectedId !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        itemId={selectedId}
      />
    </div>
  );
}
