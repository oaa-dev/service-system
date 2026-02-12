/* eslint-disable @next/next/no-img-element */
'use client';

import { use, useState, useMemo, useCallback } from 'react';
import { useMerchant, useMerchantServices, useDeleteMerchantService } from '@/hooks/useMerchants';
import { Service, ServiceQueryParams, ServiceType, MerchantStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataTableFilters, type FilterField, type FilterValues,
} from '@/components/ui/data-table-filters';
import {
  ChevronLeft, ChevronRight, MoreHorizontal, Plus, Pencil, Trash2, ClipboardList, RefreshCw, ArrowLeft, Store, CalendarClock,
} from 'lucide-react';
import Link from 'next/link';
import { CreateServiceDialog } from './create-service-dialog';
import { EditServiceDialog } from './edit-service-dialog';
import { ServiceScheduleDialog } from './service-schedule-dialog';
import { PermissionGate } from '@/components/permission-gate';

const statusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  approved: 'bg-blue-500 hover:bg-blue-600',
  active: 'bg-emerald-500 hover:bg-emerald-600',
  rejected: 'bg-red-500 hover:bg-red-600',
  suspended: 'bg-gray-500 hover:bg-gray-600',
};

const serviceTypeLabels: Record<ServiceType, string> = {
  sellable: 'Product',
  bookable: 'Booking',
  reservation: 'Reservation',
};

const serviceTypeColors: Record<ServiceType, string> = {
  sellable: 'bg-blue-500 hover:bg-blue-600',
  bookable: 'bg-emerald-500 hover:bg-emerald-600',
  reservation: 'bg-purple-500 hover:bg-purple-600',
};

const filters: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search by name...' },
  {
    key: 'is_active', label: 'Status', type: 'select',
    options: [{ label: 'Active', value: '1' }, { label: 'Inactive', value: '0' }],
  },
  {
    key: 'service_type', label: 'Type', type: 'select',
    options: [{ label: 'Product', value: 'sellable' }, { label: 'Booking', value: 'bookable' }, { label: 'Reservation', value: 'reservation' }],
  },
];

export default function MerchantServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const merchantId = parseInt(id);
  const { data: merchantData, isLoading: merchantLoading } = useMerchant(merchantId);
  const merchant = merchantData?.data;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Service | null>(null);
  const [deleteItem, setDeleteItem] = useState<Service | null>(null);
  const [scheduleItem, setScheduleItem] = useState<Service | null>(null);

  const queryParams = useMemo<ServiceQueryParams>(() => {
    const params: ServiceQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[search]'] = filterValues.search;
    if (filterValues.is_active) params['filter[is_active]'] = filterValues.is_active;
    if (filterValues.service_type) params['filter[service_type]'] = filterValues.service_type;
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useMerchantServices(merchantId, queryParams);
  const deleteMutation = useDeleteMerchantService();

  const handleFilterChange = useCallback((values: FilterValues) => { setFilterValues(values); setPage(1); }, []);
  const handleFilterReset = useCallback(() => { setFilterValues({}); setPage(1); }, []);

  const handleDelete = () => {
    if (deleteItem) {
      deleteMutation.mutate({ merchantId, serviceId: deleteItem.id }, { onSuccess: () => setDeleteItem(null) });
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
          {merchant.logo ? (
            <img src={merchant.logo.preview || merchant.logo.thumb} alt={merchant.name} className="h-12 w-12 rounded-lg object-cover border" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Services: {merchant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[merchant.status]}>{merchant.status}</Badge>
              <Badge variant="outline" className="capitalize">{merchant.type}</Badge>
            </div>
          </div>
          <PermissionGate permission="services.create">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Services</CardTitle>
                <CardDescription>Manage services offered by this merchant.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <DataTableFilters filters={filters} values={filterValues} onChange={handleFilterChange} onReset={handleFilterReset} globalSearchKey="search" globalSearchPlaceholder="Search services..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>))}</TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No services found</p>
                      <p className="text-sm text-muted-foreground">Add a service to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      {item.image ? (
                        <img src={item.image.thumb} alt={item.name} className="h-10 w-10 rounded object-cover border" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge className={serviceTypeColors[item.service_type]}>{serviceTypeLabels[item.service_type]}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{item.service_category?.name || '-'}</TableCell>
                    <TableCell>${parseFloat(item.price).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={item.is_active ? 'default' : 'secondary'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate permission="services.update"><DropdownMenuItem onClick={() => setEditItem(item)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem></PermissionGate>
                          {item.service_type === 'bookable' && (<PermissionGate permission="services.update"><DropdownMenuItem onClick={() => setScheduleItem(item)}><CalendarClock className="mr-2 h-4 w-4" /> Schedule</DropdownMenuItem></PermissionGate>)}
                          <PermissionGate permission="services.delete"><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem></PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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

      <CreateServiceDialog merchantId={merchantId} businessTypeId={merchant?.business_type_id ?? null} open={createDialogOpen} onOpenChange={setCreateDialogOpen} canSellProducts={merchant?.can_sell_products} canTakeBookings={merchant?.can_take_bookings} canRentUnits={merchant?.can_rent_units} />
      <EditServiceDialog merchantId={merchantId} businessTypeId={merchant?.business_type_id ?? null} item={editItem} open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)} canSellProducts={merchant?.can_sell_products} canTakeBookings={merchant?.can_take_bookings} canRentUnits={merchant?.can_rent_units} />
      <ServiceScheduleDialog merchantId={merchantId} service={scheduleItem} open={!!scheduleItem} onOpenChange={(open) => !open && setScheduleItem(null)} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Service</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete <span className="font-semibold">{deleteItem?.name}</span>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
