'use client';

import { useState, useMemo, useCallback } from 'react';
import { useCustomerTags, useDeleteCustomerTag } from '@/hooks/useCustomerTags';
import { CustomerTag, CustomerTagQueryParams } from '@/types/api';
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
  ChevronLeft, ChevronRight, MoreHorizontal, Plus, Pencil, Trash2, Tags, RefreshCw,
} from 'lucide-react';
import { CreateCustomerTagDialog } from './create-customer-tag-dialog';
import { EditCustomerTagDialog } from './edit-customer-tag-dialog';
import { PermissionGate } from '@/components/permission-gate';

const filters: FilterField[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by name...',
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

export default function CustomerTagsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CustomerTag | null>(null);
  const [deleteItem, setDeleteItem] = useState<CustomerTag | null>(null);

  const queryParams = useMemo<CustomerTagQueryParams>(() => {
    const params: CustomerTagQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[search]'] = filterValues.search;
    if (filterValues.is_active) params['filter[is_active]'] = filterValues.is_active;
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useCustomerTags(queryParams);
  const deleteMutation = useDeleteCustomerTag();

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterValues({});
    setPage(1);
  }, []);

  const handleDelete = () => {
    if (deleteItem) {
      deleteMutation.mutate(deleteItem.id, {
        onSuccess: () => setDeleteItem(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Tags</h1>
          <p className="text-muted-foreground">Manage tags for categorizing customers</p>
        </div>
        <PermissionGate permission="customer_tags.create">
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer Tag
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Customer Tags</CardTitle>
                <CardDescription>Manage tags used to categorize and filter customers.</CardDescription>
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
              globalSearchPlaceholder="Search customer tags..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Tags className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No customer tags found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.color ? (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-muted-foreground">{item.color}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.sort_order}</TableCell>
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
                          <PermissionGate permission="customer_tags.update">
                            <DropdownMenuItem onClick={() => setEditItem(item)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="customer_tags.delete">
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

      <CreateCustomerTagDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditCustomerTagDialog item={editItem} open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteItem?.name}</span>? This action cannot be undone.
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
