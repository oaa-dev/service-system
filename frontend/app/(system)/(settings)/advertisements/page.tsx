'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useAdvertisements,
  useCreateAdvertisement,
  useUpdateAdvertisement,
  useDeleteAdvertisement,
  useUploadAdImage,
  useDeleteAdImage,
} from '@/hooks/useAdvertisements';
import { useAllMerchants } from '@/hooks/useMerchants';
import type {
  Advertisement,
  AdvertisementQueryParams,
  ApiError,
} from '@/types/api';
import { advertisementSchema, type AdvertisementFormData } from '@/lib/validations';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  DataTableFilters,
  type FilterField,
  type FilterValues,
} from '@/components/ui/data-table-filters';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  RefreshCw,
  ImageIcon,
  X,
} from 'lucide-react';
import { PermissionGate } from '@/components/permission-gate';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import Image from 'next/image';

// ─── Label maps ──────────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  banner: 'Banner',
  featured_merchant: 'Featured Merchant',
  promotional_card: 'Promotional Card',
  popup: 'Popup',
};

const placementLabels: Record<string, string> = {
  homepage_hero: 'Homepage Hero',
  homepage_sidebar: 'Homepage Sidebar',
  merchant_listing: 'Merchant Listing',
  merchant_detail: 'Merchant Detail',
  dashboard_banner: 'Dashboard Banner',
  storefront_banner: 'Storefront Banner',
};

const audienceLabels: Record<string, string> = {
  customer: 'Customer',
  merchant: 'Merchant',
  all: 'All',
};

// ─── Static filters ───────────────────────────────────────────────────────────

const staticFilters: FilterField[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by title...',
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { label: 'Banner', value: 'banner' },
      { label: 'Featured Merchant', value: 'featured_merchant' },
      { label: 'Promotional Card', value: 'promotional_card' },
      { label: 'Popup', value: 'popup' },
    ],
  },
  {
    key: 'placement',
    label: 'Placement',
    type: 'select',
    options: [
      { label: 'Homepage Hero', value: 'homepage_hero' },
      { label: 'Homepage Sidebar', value: 'homepage_sidebar' },
      { label: 'Merchant Listing', value: 'merchant_listing' },
      { label: 'Merchant Detail', value: 'merchant_detail' },
      { label: 'Dashboard Banner', value: 'dashboard_banner' },
      { label: 'Storefront Banner', value: 'storefront_banner' },
    ],
  },
  {
    key: 'target_audience',
    label: 'Audience',
    type: 'select',
    options: [
      { label: 'Customer', value: 'customer' },
      { label: 'Merchant', value: 'merchant' },
      { label: 'All', value: 'all' },
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

// ─── Advertisement Form Dialog ────────────────────────────────────────────────

interface AdFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad?: Advertisement | null;
  onSubmit: (data: AdvertisementFormData) => void;
  isPending: boolean;
  error: AxiosError<ApiError> | null;
  title: string;
  description: string;
  merchants: { id: number; name: string }[];
  onImageUpload?: (file: File) => void;
  onImageDelete?: () => void;
  isImagePending?: boolean;
}

function AdFormDialog({
  open,
  onOpenChange,
  ad,
  onSubmit,
  isPending,
  error,
  title,
  description,
  merchants,
  onImageUpload,
  onImageDelete,
  isImagePending,
}: AdFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AdvertisementFormData>({
    resolver: zodResolver(advertisementSchema),
    defaultValues: {
      title: '',
      description: null,
      type: 'banner',
      placement: 'homepage_hero',
      target_audience: 'all',
      link_url: null,
      link_text: null,
      merchant_id: null,
      is_active: true,
      starts_at: new Date().toISOString().slice(0, 16),
      expires_at: null,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (ad) {
      form.reset({
        title: ad.title,
        description: ad.description ?? null,
        type: ad.type,
        placement: ad.placement,
        target_audience: ad.target_audience,
        link_url: ad.link_url ?? null,
        link_text: ad.link_text ?? null,
        merchant_id: ad.merchant_id ?? null,
        is_active: ad.is_active,
        starts_at: ad.starts_at.slice(0, 16),
        expires_at: ad.expires_at ? ad.expires_at.slice(0, 16) : null,
        sort_order: ad.sort_order,
      });
    } else {
      form.reset({
        title: '',
        description: null,
        type: 'banner',
        placement: 'homepage_hero',
        target_audience: 'all',
        link_url: null,
        link_text: null,
        merchant_id: null,
        is_active: true,
        starts_at: new Date().toISOString().slice(0, 16),
        expires_at: null,
        sort_order: 0,
      });
    }
  }, [open, ad, form]);

  useEffect(() => {
    if (!error) return;
    const axiosError = error;
    if (axiosError.response?.data?.errors) {
      Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
        form.setError(key as keyof AdvertisementFormData, {
          message: Array.isArray(value) ? value[0] : value,
        });
      });
    } else {
      form.setError('root', {
        message: axiosError.response?.data?.message || 'Failed to save advertisement',
      });
    }
  }, [error, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) form.reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {form.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder="Summer Sale"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={isPending}
                        rows={2}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="banner">Banner</SelectItem>
                          <SelectItem value="featured_merchant">
                            Featured Merchant
                          </SelectItem>
                          <SelectItem value="promotional_card">
                            Promotional Card
                          </SelectItem>
                          <SelectItem value="popup">Popup</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="merchant">Merchant</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="placement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placement</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="homepage_hero">
                          Homepage Hero
                        </SelectItem>
                        <SelectItem value="homepage_sidebar">
                          Homepage Sidebar
                        </SelectItem>
                        <SelectItem value="merchant_listing">
                          Merchant Listing
                        </SelectItem>
                        <SelectItem value="merchant_detail">
                          Merchant Detail
                        </SelectItem>
                        <SelectItem value="dashboard_banner">
                          Dashboard Banner
                        </SelectItem>
                        <SelectItem value="storefront_banner">
                          Storefront Banner
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="merchant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant (optional)</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === 'none' ? null : parseInt(v))
                      }
                      value={field.value ? String(field.value) : 'none'}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Platform-wide" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Platform-wide</SelectItem>
                        {merchants.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Link this ad to a specific merchant, or leave blank for
                      platform-wide.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder="https://example.com"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="link_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Text</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder="Shop Now"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value || null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={isPending}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Leave empty for no expiry
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        disabled={isPending}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription className="text-xs">
                        Advertisement is visible to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Image upload — only available after the ad is created */}
              {ad && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Image</p>
                  {ad.image ? (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted">
                      <Image
                        src={ad.image.preview}
                        alt={ad.title}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={onImageDelete}
                        disabled={isImagePending}
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center w-full aspect-video rounded-md border-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isImagePending ? (
                        <Spinner className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload image
                          </p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {!ad.image && (
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG or WebP. Max 5 MB.
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {ad ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvertisementsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Advertisement | null>(null);
  const [deleteItem, setDeleteItem] = useState<Advertisement | null>(null);

  const queryParams = useMemo<AdvertisementQueryParams>(() => {
    const params: AdvertisementQueryParams = { page, per_page: perPage };
    if (filterValues.search)
      params['filter[search]'] = filterValues.search;
    if (filterValues.type)
      params['filter[type]'] = filterValues.type as AdvertisementQueryParams['filter[type]'];
    if (filterValues.placement)
      params['filter[placement]'] = filterValues.placement as AdvertisementQueryParams['filter[placement]'];
    if (filterValues.target_audience)
      params['filter[target_audience]'] = filterValues.target_audience as AdvertisementQueryParams['filter[target_audience]'];
    if (filterValues.is_active !== undefined && filterValues.is_active !== '')
      params['filter[is_active]'] = filterValues.is_active === '1';
    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useAdvertisements(queryParams);
  const { data: allMerchantsData } = useAllMerchants();
  const merchants =
    allMerchantsData?.data?.filter((m) => !m.parent_id) ?? [];

  const createMutation = useCreateAdvertisement();
  const updateMutation = useUpdateAdvertisement();
  const deleteMutation = useDeleteAdvertisement();
  const uploadImageMutation = useUploadAdImage();
  const deleteImageMutation = useDeleteAdImage();

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterValues({});
    setPage(1);
  }, []);

  const handleCreate = (formData: AdvertisementFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setCreateOpen(false);
        toast.success('Advertisement created');
      },
    });
  };

  const handleUpdate = (formData: AdvertisementFormData) => {
    if (!editItem) return;
    updateMutation.mutate(
      { id: editItem.id, data: formData },
      {
        onSuccess: () => {
          setEditItem(null);
          toast.success('Advertisement updated');
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        setDeleteItem(null);
        toast.success('Advertisement deleted');
      },
    });
  };

  const handleImageUpload = (file: File) => {
    if (!editItem) return;
    uploadImageMutation.mutate(
      { id: editItem.id, file },
      {
        onSuccess: (updated) => {
          setEditItem(updated);
          toast.success('Image uploaded');
        },
      }
    );
  };

  const handleImageDelete = () => {
    if (!editItem) return;
    deleteImageMutation.mutate(editItem.id, {
      onSuccess: () => {
        setEditItem((prev) => prev ? { ...prev, image: null } : null);
        toast.success('Image removed');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advertisements</h1>
          <p className="text-muted-foreground">
            Manage banners, featured listings, and promotional content
          </p>
        </div>
        <PermissionGate permission="advertisements.create">
          <Button onClick={() => setCreateOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Advertisement
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Advertisements</CardTitle>
                <CardDescription>
                  View and manage all platform advertisements.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
            <DataTableFilters
              filters={staticFilters}
              values={filterValues}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              globalSearchKey="search"
              globalSearchPlaceholder="Search advertisements..."
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Impr.</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Megaphone className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">
                        No advertisements found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <div className="relative h-8 w-12 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={item.image.thumb}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <span className="font-medium line-clamp-1">
                          {item.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[item.type] ?? item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {placementLabels[item.placement] ?? item.placement}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {audienceLabels[item.target_audience] ??
                          item.target_audience}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.merchant?.name ?? (
                        <span className="italic">Platform</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={item.is_active ? 'default' : 'secondary'}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {item.is_active && !item.is_valid && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm font-mono">
                      {item.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm font-mono">
                      {item.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(item.starts_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate permission="advertisements.update">
                            <DropdownMenuItem
                              onClick={() => setEditItem(item)}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="advertisements.delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteItem(item)}
                              className="text-destructive focus:text-destructive"
                            >
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
                Showing{' '}
                <span className="font-medium">{data.meta.from || 0}</span> to{' '}
                <span className="font-medium">{data.meta.to || 0}</span> of{' '}
                <span className="font-medium">{data.meta.total}</span>
              </p>
              <Select
                value={String(perPage)}
                onValueChange={(v) => {
                  setPerPage(parseInt(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={data.meta.current_page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.meta.current_page === data.meta.last_page}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create dialog */}
      <AdFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
        error={createMutation.error as AxiosError<ApiError> | null}
        title="Create Advertisement"
        description="Create a new advertisement for the platform."
        merchants={merchants}
      />

      {/* Edit dialog */}
      <AdFormDialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        ad={editItem}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        error={updateMutation.error as AxiosError<ApiError> | null}
        title="Edit Advertisement"
        description="Update advertisement details and image."
        merchants={merchants}
        onImageUpload={handleImageUpload}
        onImageDelete={handleImageDelete}
        isImagePending={
          uploadImageMutation.isPending || deleteImageMutation.isPending
        }
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteItem?.title}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
