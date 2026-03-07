'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from '@/hooks/useCoupons';
import { Coupon, CouponQueryParams, ApiError } from '@/types/api';
import { CreateCouponFormData } from '@/lib/validations';
import { formatDate } from '@/lib/utils';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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
  ChevronLeft, ChevronRight, MoreHorizontal, Plus, Pencil, Trash2, Ticket, RefreshCw, Copy,
} from 'lucide-react';
import { CouponFormDialog } from '@/components/coupon-form-dialog';
import { PermissionGate } from '@/components/permission-gate';
import { useAllMerchants } from '@/hooks/useMerchants';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

const discountTypeLabels: Record<string, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
  free_product: 'Free Product',
};

const staticFilters: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search by name or code...' },
  {
    key: 'discount_type',
    label: 'Discount Type',
    type: 'select',
    options: [
      { label: 'Percentage', value: 'percentage' },
      { label: 'Fixed Amount', value: 'fixed' },
      { label: 'Free Product', value: 'free_product' },
    ],
  },
  {
    key: 'is_active',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '0' },
    ],
  },
];

function formatDiscount(coupon: Coupon): string {
  if (coupon.discount_type === 'percentage') return `${coupon.discount_value}%`;
  if (coupon.discount_type === 'fixed') return `₱${parseFloat(coupon.discount_value).toFixed(2)}`;
  return 'Free Product';
}

function UsageBadge({ coupon }: { coupon: Coupon }) {
  const text = coupon.max_uses
    ? `${coupon.used_count} / ${coupon.max_uses}`
    : `${coupon.used_count} used`;
  const isNearLimit = coupon.max_uses && coupon.used_count >= coupon.max_uses * 0.8;
  return (
    <Badge variant={isNearLimit ? 'destructive' : 'outline'} className="font-mono text-xs">
      {text}
    </Badge>
  );
}

export default function PlatformCouponsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Coupon | null>(null);
  const [deleteItem, setDeleteItem] = useState<Coupon | null>(null);

  const queryParams = useMemo<CouponQueryParams>(() => {
    const params: CouponQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[name]'] = filterValues.search;
    if (filterValues.discount_type) params['filter[discount_type]'] = filterValues.discount_type;
    if (filterValues.is_active) params['filter[is_active]'] = filterValues.is_active === '1';
    if (filterValues.merchant_id === 'platform') {
      params['filter[merchant_id]'] = 'null';
    } else if (filterValues.merchant_id) {
      params['filter[merchant_id]'] = filterValues.merchant_id;
    }
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useCoupons(queryParams);
  const { data: allMerchantsData } = useAllMerchants();
  const merchants = allMerchantsData?.data?.filter((m) => !m.parent_id) ?? [];

  const filters = useMemo<FilterField[]>(() => [
    ...staticFilters,
    {
      key: 'merchant_id',
      label: 'Merchant',
      type: 'select',
      options: [
        { label: 'Platform Only', value: 'platform' },
        ...merchants.map((m) => ({ label: m.name, value: String(m.id) })),
      ],
    },
  ], [merchants]);
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterValues({});
    setPage(1);
  }, []);

  const handleCreate = (formData: CreateCouponFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => { setCreateOpen(false); toast.success('Coupon created'); },
    });
  };

  const handleUpdate = (formData: CreateCouponFormData) => {
    if (!editItem) return;
    updateMutation.mutate({ id: editItem.id, data: formData }, {
      onSuccess: () => { setEditItem(null); toast.success('Coupon updated'); },
    });
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => { setDeleteItem(null); toast.success('Coupon deleted'); },
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage platform-wide and merchant coupons</p>
        </div>
        <PermissionGate permission="coupons.create">
          <Button onClick={() => setCreateOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Coupon
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Coupons</CardTitle>
                <CardDescription>View and manage all platform and merchant coupons.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <DataTableFilters
              filters={filters}
              values={filterValues}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              globalSearchKey="search"
              globalSearchPlaceholder="Search coupons..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Ticket className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No coupons found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <button
                        className="font-mono text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => copyCode(item.code)}
                        title="Click to copy"
                      >
                        {item.code}
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{discountTypeLabels[item.discount_type] || item.discount_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatDiscount(item)}</TableCell>
                    <TableCell><UsageBadge coupon={item} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {item.is_public && (
                          <Badge variant="outline" className="text-xs">Public</Badge>
                        )}
                        {!item.is_valid && item.is_active && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.merchant?.name ?? <span className="italic">Platform</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.created_at ? formatDate(item.created_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate permission="coupons.update">
                            <DropdownMenuItem onClick={() => setEditItem(item)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="coupons.delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </PermissionGate>
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
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{data.meta.from || 0}</span> to{' '}
                <span className="font-medium">{data.meta.to || 0}</span> of{' '}
                <span className="font-medium">{data.meta.total}</span>
              </p>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}>
                <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={data.meta.current_page === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={data.meta.current_page === data.meta.last_page}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CouponFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        error={createMutation.error as AxiosError<ApiError> | null}
        title="Create Coupon"
        description="Create a new platform-wide or merchant coupon."
        merchants={merchants}
      />

      <CouponFormDialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        coupon={editItem}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        error={updateMutation.error as AxiosError<ApiError> | null}
        title="Edit Coupon"
        description="Update coupon details."
        merchants={merchants}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteItem?.name}</span> ({deleteItem?.code})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
