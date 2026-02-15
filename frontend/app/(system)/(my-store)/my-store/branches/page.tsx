'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMyMerchant, useMyBranches, useCreateMyBranch, useUpdateMyBranch, useDeleteMyBranch } from '@/hooks/useMyMerchant';
import { Merchant, BranchQueryParams, StoreBranchRequest, UpdateBranchRequest, MerchantStatus, merchantStatusLabels } from '@/types/api';
import { createBranchSchema, updateBranchSchema, type CreateBranchFormData, type UpdateBranchFormData } from '@/lib/validations';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableFilters, type FilterField, type FilterValues } from '@/components/ui/data-table-filters';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Pencil, Trash2, Building2, RefreshCw, Store } from 'lucide-react';
import { AddressFormFields } from '@/components/address-form-fields';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

const statusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  submitted: 'bg-orange-500 hover:bg-orange-600',
  approved: 'bg-blue-500 hover:bg-blue-600',
  active: 'bg-emerald-500 hover:bg-emerald-600',
  rejected: 'bg-red-500 hover:bg-red-600',
  suspended: 'bg-gray-500 hover:bg-gray-600',
};

const tableFilters: FilterField[] = [
  { key: 'search', label: 'Search', type: 'text', placeholder: 'Search branches...' },
  {
    key: 'status', label: 'Status', type: 'select',
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Active', value: 'active' },
      { label: 'Suspended', value: 'suspended' },
    ],
  },
];

function CreateBranchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateMyBranch();

  const form = useForm<CreateBranchFormData>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: '',
      user_name: '',
      user_email: '',
      user_password: '',
      description: '',
      contact_email: '',
      contact_phone: '',
      address: { street: '', region_id: null, province_id: null, city_id: null, barangay_id: null, postal_code: '' },
    },
  });

  const onSubmit = (values: CreateBranchFormData) => {
    const addr = values.address;
    const cleaned: StoreBranchRequest = {
      name: values.name,
      user_name: values.user_name,
      user_email: values.user_email,
      user_password: values.user_password,
      ...(values.description ? { description: values.description } : {}),
      ...(values.contact_email ? { contact_email: values.contact_email } : {}),
      ...(values.contact_phone ? { contact_phone: values.contact_phone } : {}),
      ...(addr && (addr.street || addr.region_id || addr.postal_code) ? {
        address: {
          ...(addr.street ? { street: addr.street } : {}),
          ...(addr.region_id ? { region_id: addr.region_id } : {}),
          ...(addr.province_id ? { province_id: addr.province_id } : {}),
          ...(addr.city_id ? { city_id: addr.city_id } : {}),
          ...(addr.barangay_id ? { barangay_id: addr.barangay_id } : {}),
          ...(addr.postal_code ? { postal_code: addr.postal_code } : {}),
        },
      } : {}),
    };

    createMutation.mutate(cleaned, {
      onSuccess: () => {
        toast.success('Branch created successfully');
        form.reset();
        onOpenChange(false);
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast.error(axiosError.response?.data?.message || 'Failed to create branch');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Branch</DialogTitle>
          <DialogDescription>Add a new branch location for your organization.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Branch Name *</FormLabel>
                <FormControl><Input {...field} placeholder="Branch name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ''} placeholder="Brief description" rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="space-y-2 rounded-md border p-4">
              <p className="text-sm font-medium">Branch Manager Account</p>
              <p className="text-xs text-muted-foreground">This person will be able to log in and manage the branch.</p>

              <FormField control={form.control} name="user_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager Name *</FormLabel>
                  <FormControl><Input {...field} placeholder="Full name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="user_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Login Email *</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="manager@example.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="user_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl><Input {...field} type="password" placeholder="Minimum 8 characters" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="contact_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} type="email" placeholder="branch@example.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} placeholder="09xxxxxxxxx" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Address</p>
              <AddressFormFields control={form.control} namePrefix="address" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

function EditBranchDialog({ branch, open, onOpenChange }: { branch: Merchant | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updateMutation = useUpdateMyBranch();

  const form = useForm<UpdateBranchFormData>({
    resolver: zodResolver(updateBranchSchema),
    defaultValues: {
      name: '',
      description: '',
      contact_email: '',
      contact_phone: '',
      address: { street: '', region_id: null, province_id: null, city_id: null, barangay_id: null, postal_code: '' },
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name || '',
        description: branch.description || '',
        contact_email: branch.contact_email || '',
        contact_phone: branch.contact_phone || '',
        address: {
          street: branch.address?.street || '',
          region_id: branch.address?.region?.id ?? null,
          province_id: branch.address?.province?.id ?? null,
          city_id: branch.address?.city?.id ?? null,
          barangay_id: branch.address?.barangay?.id ?? null,
          postal_code: branch.address?.postal_code || '',
        },
      });
    }
  }, [branch, form]);

  const onSubmit = (values: UpdateBranchFormData) => {
    if (!branch) return;

    const addr = values.address;
    const data: UpdateBranchRequest = {
      ...(values.name && values.name !== branch.name ? { name: values.name } : {}),
      ...((values.description ?? '') !== (branch.description ?? '') ? { description: values.description || undefined } : {}),
      ...((values.contact_email ?? '') !== (branch.contact_email ?? '') ? { contact_email: values.contact_email || undefined } : {}),
      ...((values.contact_phone ?? '') !== (branch.contact_phone ?? '') ? { contact_phone: values.contact_phone || undefined } : {}),
      ...(addr && (addr.street || addr.region_id || addr.postal_code) ? {
        address: {
          ...(addr.street ? { street: addr.street } : {}),
          ...(addr.region_id ? { region_id: addr.region_id } : {}),
          ...(addr.province_id ? { province_id: addr.province_id } : {}),
          ...(addr.city_id ? { city_id: addr.city_id } : {}),
          ...(addr.barangay_id ? { barangay_id: addr.barangay_id } : {}),
          ...(addr.postal_code ? { postal_code: addr.postal_code } : {}),
        },
      } : {}),
    };

    updateMutation.mutate({ branchId: branch.id, data }, {
      onSuccess: () => {
        toast.success('Branch updated successfully');
        onOpenChange(false);
      },
      onError: (error: Error) => {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast.error(axiosError.response?.data?.message || 'Failed to update branch');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>Update branch details.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ''} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="contact_email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Address</p>
              <AddressFormFields control={form.control} namePrefix="address" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

export default function MyStoreBranchesPage() {
  const { data: merchantData, isLoading: merchantLoading } = useMyMerchant();
  const merchant = merchantData;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Merchant | null>(null);
  const [deleteItem, setDeleteItem] = useState<Merchant | null>(null);

  const queryParams = useMemo<BranchQueryParams>(() => {
    const params: BranchQueryParams = { page, per_page: perPage };
    if (filterValues.search) params['filter[search]'] = filterValues.search;
    if (filterValues.status) params['filter[status]'] = filterValues.status as MerchantStatus;
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useMyBranches(queryParams);
  const deleteMutation = useDeleteMyBranch();

  const handleFilterChange = useCallback((values: FilterValues) => { setFilterValues(values); setPage(1); }, []);
  const handleFilterReset = useCallback(() => { setFilterValues({}); setPage(1); }, []);

  const handleDelete = () => {
    if (deleteItem) {
      deleteMutation.mutate(deleteItem.id, {
        onSuccess: () => {
          toast.success('Branch deleted successfully');
          setDeleteItem(null);
        },
        onError: (error: Error) => {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(axiosError.response?.data?.message || 'Failed to delete branch');
        },
      });
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
        <p className="text-lg font-medium text-muted-foreground">Store not found</p>
      </div>
    );
  }

  if (merchant.type !== 'organization') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Branch management is only available for organization-type merchants</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">Manage branch locations for your organization</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Branch
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Branch Locations</CardTitle>
                <CardDescription>All branch locations under your organization.</CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <DataTableFilters filters={tableFilters} values={filterValues} onChange={handleFilterChange} onReset={handleFilterReset} globalSearchKey="search" globalSearchPlaceholder="Search branches..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>))}</TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Building2 className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No branches found</p>
                      <p className="text-sm text-muted-foreground">Add a branch to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.contact_email || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.contact_phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status]}>
                        {merchantStatusLabels[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.created_at ? formatDate(item.created_at) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditItem(item)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteItem(item)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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

      <CreateBranchDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditBranchDialog branch={editItem} open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)} />

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
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
