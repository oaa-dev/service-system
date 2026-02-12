'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { Customer, CustomerQueryParams, CustomerStatus } from '@/types/api';
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
  ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2, UserCheck, RefreshCw, Eye, ArrowRightLeft,
} from 'lucide-react';
import Link from 'next/link';
import { CreateCustomerDialog } from './create-customer-dialog';
import { UpdateCustomerStatusDialog } from './update-status-dialog';
import { PermissionGate } from '@/components/permission-gate';

const statusColors: Record<CustomerStatus, string> = {
  active: 'bg-emerald-500 hover:bg-emerald-600',
  suspended: 'bg-yellow-500 hover:bg-yellow-600',
  banned: 'bg-red-500 hover:bg-red-600',
};

const tierColors: Record<string, string> = {
  regular: 'bg-gray-500',
  silver: 'bg-slate-400',
  gold: 'bg-amber-500',
  platinum: 'bg-violet-500',
};

const filters: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search by name or email...' },
  {
    key: 'status', label: 'Status', type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Suspended', value: 'suspended' },
      { label: 'Banned', value: 'banned' },
    ],
  },
  {
    key: 'customer_type', label: 'Type', type: 'select',
    options: [
      { label: 'Individual', value: 'individual' },
      { label: 'Corporate', value: 'corporate' },
    ],
  },
  {
    key: 'customer_tier', label: 'Tier', type: 'select',
    options: [
      { label: 'Regular', value: 'regular' },
      { label: 'Silver', value: 'silver' },
      { label: 'Gold', value: 'gold' },
      { label: 'Platinum', value: 'platinum' },
    ],
  },
];

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Customer | null>(null);
  const [statusItem, setStatusItem] = useState<Customer | null>(null);

  const queryParams = useMemo<CustomerQueryParams>(() => {
    const params: CustomerQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[search]'] = filterValues.search;
    if (filterValues.status) params['filter[status]'] = filterValues.status as CustomerStatus;
    if (filterValues.customer_type) params['filter[customer_type]'] = filterValues.customer_type as 'individual' | 'corporate';
    if (filterValues.customer_tier) params['filter[customer_tier]'] = filterValues.customer_tier as 'regular' | 'silver' | 'gold' | 'platinum';
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useCustomers(queryParams);
  const deleteMutation = useDeleteCustomer();

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
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage all customer accounts and their status</p>
        </div>
        <PermissionGate permission="customers.create">
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {(['active', 'suspended', 'banned'] as CustomerStatus[]).map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${statusColors[status].split(' ')[0].replace('bg-', 'bg-')}/10`}>
                  <UserCheck className={`h-5 w-5 ${statusColors[status].split(' ')[0].replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  <p className="text-2xl font-bold">
                    {data?.data?.filter((c) => c.status === status).length || 0}
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
                <CardTitle>All Customers</CardTitle>
                <CardDescription>View and manage customer accounts.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <DataTableFilters filters={filters} values={filterValues} onChange={handleFilterChange} onReset={handleFilterReset} globalSearchKey="search" globalSearchPlaceholder="Search customers..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>))}</TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <UserCheck className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No customers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((customer) => (
                  <TableRow key={customer.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.user?.name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{customer.user?.email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{customer.customer_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={tierColors[customer.customer_tier] || 'bg-gray-500'}>
                        {customer.customer_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[customer.status]}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.loyalty_points.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags && customer.tags.length > 0 ? (
                          customer.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs" style={tag.color ? { borderLeft: `3px solid ${tag.color}` } : undefined}>
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                        {customer.tags && customer.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{customer.tags.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.created_at ? formatDate(customer.created_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate permission="customers.view">
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="customers.update_status">
                            <DropdownMenuItem onClick={() => setStatusItem(customer)}>
                              <ArrowRightLeft className="mr-2 h-4 w-4" /> Update Status
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="customers.delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteItem(customer)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Deactivate
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

      <CreateCustomerDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <UpdateCustomerStatusDialog item={statusItem} open={!!statusItem} onOpenChange={(open) => !open && setStatusItem(null)} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <span className="font-semibold">{deleteItem?.user?.name}</span>? This will set the customer status to banned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
