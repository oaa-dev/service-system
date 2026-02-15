'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMerchants, useDeleteMerchant } from '@/hooks/useMerchants';
import { Merchant, MerchantQueryParams, MerchantStatus, merchantStatusLabels } from '@/types/api';
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
  ChevronLeft, ChevronRight, MoreHorizontal, Plus, Pencil, Trash2, Store, RefreshCw, Eye, ArrowRightLeft,
} from 'lucide-react';
import { CreateMerchantDialog } from './create-merchant-dialog';
import { UpdateStatusDialog } from './update-status-dialog';
import { PermissionGate } from '@/components/permission-gate';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

const statusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  submitted: 'bg-orange-500 hover:bg-orange-600',
  approved: 'bg-blue-500 hover:bg-blue-600',
  active: 'bg-emerald-500 hover:bg-emerald-600',
  rejected: 'bg-red-500 hover:bg-red-600',
  suspended: 'bg-gray-500 hover:bg-gray-600',
};

const filters: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search by name...' },
  {
    key: 'status', label: 'Status', type: 'select',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'For Review', value: 'submitted' },
      { label: 'Approved', value: 'approved' },
      { label: 'Active', value: 'active' },
      { label: 'Rejected', value: 'rejected' },
      { label: 'Suspended', value: 'suspended' },
    ],
  },
  {
    key: 'type', label: 'Type', type: 'select',
    options: [
      { label: 'Individual', value: 'individual' },
      { label: 'Organization', value: 'organization' },
    ],
  },
];

export default function MerchantsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Merchant | null>(null);
  const [statusItem, setStatusItem] = useState<Merchant | null>(null);

  const queryParams = useMemo<MerchantQueryParams>(() => {
    const params: MerchantQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[search]'] = filterValues.search;
    if (filterValues.status) params['filter[status]'] = filterValues.status as MerchantStatus;
    if (filterValues.type) params['filter[type]'] = filterValues.type as 'individual' | 'organization';
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useMerchants(queryParams);
  const deleteMutation = useDeleteMerchant();

  const handleFilterChange = useCallback((values: FilterValues) => { setFilterValues(values); setPage(1); }, []);
  const handleFilterReset = useCallback(() => { setFilterValues({}); setPage(1); }, []);

  const handleDelete = () => {
    if (deleteItem) {
      deleteMutation.mutate(deleteItem.id, { onSuccess: () => setDeleteItem(null) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchants</h1>
          <p className="text-muted-foreground">Manage all merchant accounts and their status</p>
        </div>
        <PermissionGate permission="merchants.create">
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Add Merchant
          </Button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['pending', 'submitted', 'approved', 'active', 'suspended'] as MerchantStatus[]).map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${statusColors[status].replace('hover:', '')}/10`}>
                  <Store className={`h-5 w-5 ${statusColors[status].split(' ')[0].replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{merchantStatusLabels[status]}</p>
                  <p className="text-2xl font-bold">
                    {data?.data?.filter((m) => m.status === status).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Merchants</CardTitle>
                <CardDescription>View and manage merchant accounts.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <DataTableFilters filters={filters} values={filterValues} onChange={handleFilterChange} onReset={handleFilterReset} globalSearchKey="search" globalSearchPlaceholder="Search merchants..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Merchant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
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
                      <Store className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No merchants found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((merchant) => (
                  <TableRow key={merchant.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {merchant.logo ? (
                          <img src={merchant.logo.thumb} alt={merchant.name} className="h-10 w-10 rounded-lg object-cover border" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{merchant.name}</p>
                          <p className="text-xs text-muted-foreground">{merchant.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="capitalize">{merchant.type}</Badge>
                        {merchant.parent_id && (
                          <Badge variant="secondary" className="text-xs">Branch</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {merchant.contact_email && <p className="text-muted-foreground truncate max-w-[150px]">{merchant.contact_email}</p>}
                        {merchant.contact_phone && <p className="text-muted-foreground">{merchant.contact_phone}</p>}
                        {!merchant.contact_email && !merchant.contact_phone && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[merchant.status]}>
                        {merchantStatusLabels[merchant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {merchant.user?.name || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {merchant.created_at ? formatDate(merchant.created_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate permission="merchants.view">
                            <DropdownMenuItem asChild>
                              <Link href={`/merchants/${merchant.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="merchants.update">
                            <DropdownMenuItem asChild>
                              <Link href={`/merchants/${merchant.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="merchants.update_status">
                            <DropdownMenuItem onClick={() => setStatusItem(merchant)}>
                              <ArrowRightLeft className="mr-2 h-4 w-4" /> Update Status
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="merchants.delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(merchant)} className="text-destructive focus:text-destructive">
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
                Showing <span className="font-medium">{data.meta.from || 0}</span> to <span className="font-medium">{data.meta.to || 0}</span> of <span className="font-medium">{data.meta.total}</span>
              </p>
              <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}>
                <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                <SelectContent>{[5, 10, 25, 50].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={data.meta.current_page === 1}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={data.meta.current_page === data.meta.last_page}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </Card>

      <CreateMerchantDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <UpdateStatusDialog item={statusItem} open={!!statusItem} onOpenChange={(open) => !open && setStatusItem(null)} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Merchant</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <span className="font-semibold">{deleteItem?.name}</span>? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
