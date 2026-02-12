/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMerchantService, useUploadServiceImage } from '@/hooks/useMerchants';
import { useActiveServiceCategories } from '@/hooks/useServiceCategories';
import { createServiceSchema, type CreateServiceFormData } from '@/lib/validations';
import { ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { Upload, X, ClipboardList } from 'lucide-react';
import { AxiosError } from 'axios';
import { CustomFieldsRenderer } from './custom-fields-renderer';

interface Props { merchantId: number; businessTypeId: number | null; open: boolean; onOpenChange: (open: boolean) => void; canSellProducts?: boolean; canTakeBookings?: boolean; canRentUnits?: boolean; }

export function CreateServiceDialog({ merchantId, businessTypeId, open, onOpenChange, canSellProducts, canTakeBookings, canRentUnits }: Props) {
  const mutation = useCreateMerchantService();
  const uploadMutation = useUploadServiceImage();
  const { data: categoriesData } = useActiveServiceCategories(merchantId);
  const categories = categoriesData?.data || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | number | number[]>>({});

  const form = useForm<CreateServiceFormData>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: { name: '', service_category_id: null, description: '', price: 0, is_active: true, service_type: 'sellable' as const, sku: '', stock_quantity: null, track_stock: false, duration: null, max_capacity: 1, requires_confirmation: false, price_per_night: null, floor: '', unit_status: 'available' as const, amenities: null },
  });

  const cleanup = useCallback(() => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setRawImageSrc(null);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
  }, [rawImageSrc, croppedPreviewUrl]);

  useEffect(() => {
    if (!open) {
      form.reset();
      cleanup();
      setCustomFieldValues({});
    }
  }, [open, form, cleanup]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    const url = URL.createObjectURL(file);
    setRawImageSrc(url);
    setCropDialogOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedBlob(blob);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setCroppedPreviewUrl(URL.createObjectURL(blob));
    setCropDialogOpen(false);
  };

  const handleRemoveImage = () => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setRawImageSrc(null);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
  };

  const onSubmit = (data: CreateServiceFormData) => {
    const payload = {
      ...data,
      custom_fields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
    };
    mutation.mutate({ merchantId, data: payload }, {
      onSuccess: (response) => {
        if (croppedBlob && response?.data?.id) {
          const file = new File([croppedBlob], 'service-image.jpg', { type: 'image/jpeg' });
          uploadMutation.mutate({ merchantId, serviceId: response.data.id, file }, {
            onSuccess: () => onOpenChange(false),
            onError: () => onOpenChange(false),
          });
        } else {
          onOpenChange(false);
        }
      },
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateServiceFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to create service' });
        }
      },
    });
  };

  const isPending = mutation.isPending || uploadMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { form.reset(); cleanup(); setCustomFieldValues({}); } onOpenChange(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Service</DialogTitle><DialogDescription>Add a new service for this merchant.</DialogDescription></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}

                {/* Image section */}
                <div>
                  <FormLabel>Image</FormLabel>
                  <div className="flex items-center gap-4 mt-2">
                    {croppedPreviewUrl ? (
                      <img src={croppedPreviewUrl} alt="Service preview" className="h-16 w-16 rounded-lg object-cover border" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted border">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
                        <Upload className="mr-2 h-3 w-3" />
                        {croppedPreviewUrl ? 'Change' : 'Upload'}
                      </Button>
                      {croppedPreviewUrl && (
                        <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage} disabled={isPending}>
                          <X className="mr-2 h-3 w-3" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input disabled={isPending} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="service_category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v ? parseInt(v) : null)}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category (optional)" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea disabled={isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" min="0" disabled={isPending} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-2"><FormLabel>Active</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl></FormItem>
                  )} />
                </div>

                <Separator />
                <FormField control={form.control} name="service_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {canSellProducts && <SelectItem value="sellable">Product (Sellable)</SelectItem>}
                        {canTakeBookings && <SelectItem value="bookable">Booking</SelectItem>}
                        {canRentUnits && <SelectItem value="reservation">Reservation</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {form.watch('service_type') === 'sellable' && canSellProducts && (<>
                  <p className="text-sm font-medium">Product Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input disabled={isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="stock_quantity" render={({ field }) => (<FormItem><FormLabel>Stock Qty</FormLabel><FormControl><Input type="number" min="0" disabled={isPending} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="track_stock" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Track stock</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl></FormItem>
                  )} />
                </>)}

                {form.watch('service_type') === 'bookable' && canTakeBookings && (<>
                  <p className="text-sm font-medium">Booking Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" min="5" max="1440" disabled={isPending} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="max_capacity" render={({ field }) => (<FormItem><FormLabel>Max Capacity</FormLabel><FormControl><Input type="number" min="1" disabled={isPending} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="requires_confirmation" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Requires confirmation</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl></FormItem>
                  )} />
                </>)}

                {form.watch('service_type') === 'reservation' && canRentUnits && (<>
                  <p className="text-sm font-medium">Reservation Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price_per_night" render={({ field }) => (<FormItem><FormLabel>Price per Night ($)</FormLabel><FormControl><Input type="number" step="0.01" min="0" disabled={isPending} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="floor" render={({ field }) => (<FormItem><FormLabel>Floor</FormLabel><FormControl><Input disabled={isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="unit_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Status</FormLabel>
                      <Select value={field.value || 'available'} onValueChange={field.onChange} disabled={isPending}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amenities" render={({ field }) => (<FormItem><FormLabel>Amenities</FormLabel><FormControl><Input placeholder="e.g. WiFi, TV, Air Conditioning" disabled={isPending} value={field.value?.join(', ') || ''} onChange={(e) => { const val = e.target.value; field.onChange(val ? val.split(',').map(s => s.trim()).filter(Boolean) : null); }} /></FormControl><FormMessage /></FormItem>)} />
                </>)}

                {businessTypeId && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium">Custom Fields</p>
                    <CustomFieldsRenderer
                      businessTypeId={businessTypeId}
                      values={customFieldValues}
                      onChange={setCustomFieldValues}
                      disabled={isPending}
                    />
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending && <Spinner className="mr-2 h-4 w-4" />}{uploadMutation.isPending ? 'Uploading image...' : mutation.isPending ? 'Creating...' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        title="Crop Service Image"
        description="Adjust and crop the service image"
        saveLabel="Apply Crop"
        cropShape="rect"
      />
    </>
  );
}
