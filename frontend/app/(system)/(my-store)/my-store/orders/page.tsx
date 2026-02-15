'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useServiceOrders, useUpdateServiceOrderStatus } from '@/hooks/useServiceOrders';
import { ServiceOrder, ServiceOrderStatus, ServiceOrderQueryParams } from '@/types/api';
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
  ChevronLeft, ChevronRight, Package, User, Truck, CheckCircle, Ban, ClipboardList, Clock, Loader, RefreshCw, Plus,
} from 'lucide-react';
import { CreateOrderDialog } from '@/app/(system)/(merchants)/merchants/[id]/orders/create-order-dialog';

const orderStatusColors: Record<ServiceOrderStatus, string> = {
  pending: 'bg-yellow-500',
  received: 'bg-blue-500',
  processing: 'bg-indigo-500',
  ready: 'bg-emerald-500',
  delivering: 'bg-orange-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

const filters: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search by customer or order...' },
  {
    key: 'status', label: 'Status', type: 'select',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Received', value: 'received' },
      { label: 'Processing', value: 'processing' },
      { label: 'Ready', value: 'ready' },
      { label: 'Delivering', value: 'delivering' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
];

const VALID_ACTIONS: Record<string, { label: string; status: ServiceOrderStatus; icon: React.ReactNode; variant?: 'default' | 'destructive' | 'outline' }[]> = {
  pending: [
    { label: 'Receive', status: 'received', icon: <Package className="mr-1 h-3 w-3" /> },
    { label: 'Cancel', status: 'cancelled', icon: <Ban className="mr-1 h-3 w-3" />, variant: 'destructive' },
  ],
  received: [
    { label: 'Process', status: 'processing', icon: <Loader className="mr-1 h-3 w-3" /> },
    { label: 'Cancel', status: 'cancelled', icon: <Ban className="mr-1 h-3 w-3" />, variant: 'destructive' },
  ],
  processing: [
    { label: 'Mark Ready', status: 'ready', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
  ],
  ready: [
    { label: 'Complete', status: 'completed', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
    { label: 'Deliver', status: 'delivering', icon: <Truck className="mr-1 h-3 w-3" />, variant: 'outline' },
  ],
  delivering: [
    { label: 'Complete', status: 'completed', icon: <CheckCircle className="mr-1 h-3 w-3" /> },
  ],
};

export default function MyStoreOrdersPage() {
  const { user } = useAuthStore();
  const merchantId = user?.merchant?.id;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [statusAction, setStatusAction] = useState<{ order: ServiceOrder; status: ServiceOrderStatus } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = useMemo<ServiceOrderQueryParams>(() => {
    const params: ServiceOrderQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[search]'] = filterValues.search;
    if (filterValues.status) params['filter[status]'] = filterValues.status;
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useServiceOrders(merchantId!, queryParams);
  const statusMutation = useUpdateServiceOrderStatus();

  const handleFilterChange = useCallback((values: FilterValues) => { setFilterValues(values); setPage(1); }, []);
  const handleFilterReset = useCallback(() => { setFilterValues({}); setPage(1); }, []);

  const handleStatusUpdate = () => {
    if (statusAction && merchantId) {
      statusMutation.mutate(
        { merchantId, serviceOrderId: statusAction.order.id, data: { status: statusAction.status } },
        { onSuccess: () => setStatusAction(null) }
      );
    }
  };

  if (!merchantId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Loading your store...</p>
      </div>
    );
  }

  if (!user?.merchant?.can_sell_products) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Product orders not enabled</p>
        <p className="text-sm text-muted-foreground">Contact support to enable product sales for your store</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Orders</h1>
          <p className="text-muted-foreground">Manage your product and service orders</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Service Orders</CardTitle>
                <CardDescription>Track and fulfill customer orders</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Order
                </Button>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <DataTableFilters filters={filters} values={filterValues} onChange={handleFilterChange} onReset={handleFilterReset} globalSearchKey="search" globalSearchPlaceholder="Search orders..." />
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
              <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground font-medium">No service orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.data?.map((order) => (
                <div key={order.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{order.order_number}</span>
                        <span className="text-muted-foreground">{order.service?.name || `Service #${order.service_id}`}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.customer?.name || 'Unknown'}
                        <span className="mx-1">&middot;</span>
                        {order.quantity} {order.unit_label} @ {order.unit_price} = {parseFloat(order.fee_amount) > 0 ? (
                          <>{order.total_price} + Fee ({order.fee_rate}%): {order.fee_amount} = Total: {order.total_amount}</>
                        ) : (
                          <>{order.total_price}</>
                        )}
                      </div>
                      {order.estimated_completion && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Est. completion: {order.estimated_completion}
                        </div>
                      )}
                      {order.notes && <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={orderStatusColors[order.status]}>{order.status}</Badge>
                    </div>
                  </div>
                  {VALID_ACTIONS[order.status] && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      {VALID_ACTIONS[order.status].map((action) => (
                        <Button
                          key={action.status}
                          variant={action.variant || 'default'}
                          size="sm"
                          onClick={() => setStatusAction({ order, status: action.status })}
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

      <CreateOrderDialog merchantId={merchantId} serviceMerchantId={user?.merchant?.parent_id ?? undefined} open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change order {statusAction?.order.order_number} status to <span className="font-semibold">{statusAction?.status}</span>?
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
