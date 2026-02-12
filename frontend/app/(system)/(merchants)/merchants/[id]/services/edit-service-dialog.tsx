/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateMerchantService, useUploadServiceImage, useDeleteServiceImage } from '@/hooks/useMerchants';
import { useActiveServiceCategories } from '@/hooks/useServiceCategories';
import { updateServiceSchema, type UpdateServiceFormData } from '@/lib/validations';
import { Service, ApiError } from '@/types/api';
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
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { Upload, Trash2, ClipboardList } from 'lucide-react';
import { AxiosError } from 'axios';
import { CustomFieldsRenderer } from './custom-fields-renderer';

interface Props { merchantId: number; businessTypeId: number | null; item: Service | null; open: boolean; onOpenChange: (open: boolean) => void; canSellProducts?: boolean; canTakeBookings?: boolean; canRentUnits?: boolean; }

export function EditServiceDialog({ merchantId, businessTypeId, item, open, onOpenChange, canSellProducts, canTakeBookings, canRentUnits }: Props) {
  const mutation = useUpdateMerchantService();
  const uploadMutation = useUploadServiceImage();
  const deleteMutation = useDeleteServiceImage();
  const { data: categoriesData } = useActiveServiceCategories(merchantId);
  const categories = categoriesData?.data || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | number | number[]>>({});

  const form = useForm<UpdateServiceFormData>({
    resolver: zodResolver(updateServiceSchema),
    defaultValues: { name: '', service_category_id: null, description: '', price: 0, is_active: true, sku: '', stock_quantity: null, track_stock: false, duration: null, max_capacity: 1, requires_confirmation: false, price_per_night: null, floor: '', unit_status: 'available' as const, amenities: null },
  });

  const cleanup = useCallback(() => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    if (croppedPreviewUrl) URL.revokeObjectURL(croppedPreviewUrl);
    setRawImageSrc(null);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
  }, [rawImageSrc, croppedPreviewUrl]);

  useEffect(() => {
    if (item && open) {
      form.reset({
        name: item.name,
        service_category_id: item.service_category_id,
        description: item.description || '',
        price: parseFloat(item.price),
        is_active: item.is_active,
        sku: item.sku || '',
        stock_quantity: item.stock_quantity,
        track_stock: item.track_stock,
        duration: item.duration,
        max_capacity: item.max_capacity,
        requires_confirmation: item.requires_confirmation,
        price_per_night: item.price_per_night ? parseFloat(item.price_per_night) : null,
        floor: item.floor || '',
        unit_status: item.unit_status || 'available',
        amenities: item.amenities || null,
      });
      cleanup();

      // Initialize custom fields from existing service data
      if (item.custom_fields && item.custom_fields.length > 0) {
        const cfValues: Record<string, string | number | number[]> = {};
        const grouped = new Map<number, typeof item.custom_fields>();
        item.custom_fields.forEach(cf => {
          const key = cf.business_type_field_id;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(cf);
        });

        grouped.forEach((values, btFieldId) => {
          if (values.length === 1 && values[0].field_value_id) {
            // select/radio: single field_value_id
            cfValues[String(btFieldId)] = values[0].field_value_id;
          } else if (values.length > 1 || (values.length === 1 && values[0].field_value_id && values.some(v => v.business_type_field?.field?.type === 'checkbox'))) {
            // checkbox: array of field_value_ids
            cfValues[String(btFieldId)] = values.filter(v => v.field_value_id).map(v => v.field_value_id!);
          } else if (values[0].value !== null) {
            // input: text value
            cfValues[String(btFieldId)] = values[0].value;
          }
        });
        setCustomFieldValues(cfValues);
      } else {
        setCustomFieldValues({});
      }
    }
  }, [item, open, form, cleanup]);

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
    if (!item) return;
    const file = new File([blob], 'service-image.jpg', { type: 'image/jpeg' });
    uploadMutation.mutate({ merchantId, serviceId: item.id, file });
    setCropDialogOpen(false);
    cleanup();
  };

  const handleImageDelete = () => {
    if (!item) return;
    deleteMutation.mutate({ merchantId, serviceId: item.id });
  };

  const onSubmit = (data: UpdateServiceFormData) => {
    if (!item) return;
    const payload = {
      ...data,
      custom_fields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
    };
    mutation.mutate({ merchantId, serviceId: item.id, data: payload }, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof UpdateServiceFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to update service' });
        }
      },
    });
  };

  const isUploading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) { form.reset(); cleanup(); setCustomFieldValues({}); } onOpenChange(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Service</DialogTitle><DialogDescription>Update service details.</DialogDescription></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}

                {/* Image section */}
                <div className="flex items-center gap-4">
                  {item?.image ? (
                    <img src={item.image.thumb} alt={item.name} className="h-16 w-16 rounded-lg object-cover border" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted border">
                      <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {uploadMutation.isPending ? <Spinner className="mr-2 h-3 w-3" /> : <Upload className="mr-2 h-3 w-3" />}
                      {item?.image ? 'Replace' : 'Upload'}
                    </Button>
                    {item?.image && (
                      <Button type="button" variant="outline" size="sm" onClick={handleImageDelete} disabled={isUploading}>
                        {deleteMutation.isPending ? <Spinner className="mr-2 h-3 w-3" /> : <Trash2 className="mr-2 h-3 w-3" />}
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="service_category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v ? parseInt(v) : null)}
                      disabled={mutation.isPending}
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
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" min="0" disabled={mutation.isPending} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-2"><FormLabel>Active</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} /></FormControl></FormItem>
                  )} />
                </div>

                <Separator />
                <div>
                  <FormLabel>Service Type</FormLabel>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-sm">
                      {item?.service_type === 'sellable' ? 'Product (Sellable)' : item?.service_type === 'bookable' ? 'Booking' : item?.service_type === 'reservation' ? 'Reservation' : '-'}
                    </Badge>
                  </div>
                </div>

                {item?.service_type === 'sellable' && canSellProducts && (<>
                  <p className="text-sm font-medium">Product Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="stock_quantity" render={({ field }) => (<FormItem><FormLabel>Stock Qty</FormLabel><FormControl><Input type="number" min="0" disabled={mutation.isPending} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="track_stock" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Track stock</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} /></FormControl></FormItem>
                  )} />
                </>)}

                {item?.service_type === 'bookable' && canTakeBookings && (<>
                  <p className="text-sm font-medium">Booking Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" min="5" max="1440" disabled={mutation.isPending} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="max_capacity" render={({ field }) => (<FormItem><FormLabel>Max Capacity</FormLabel><FormControl><Input type="number" min="1" disabled={mutation.isPending} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="requires_confirmation" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Requires confirmation</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} /></FormControl></FormItem>
                  )} />
                </>)}

                {item?.service_type === 'reservation' && canRentUnits && (<>
                  <p className="text-sm font-medium">Reservation Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price_per_night" render={({ field }) => (<FormItem><FormLabel>Price per Night ($)</FormLabel><FormControl><Input type="number" step="0.01" min="0" disabled={mutation.isPending} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="floor" render={({ field }) => (<FormItem><FormLabel>Floor</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="unit_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Status</FormLabel>
                      <Select value={field.value || 'available'} onValueChange={field.onChange} disabled={mutation.isPending}>
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
                  <FormField control={form.control} name="amenities" render={({ field }) => (<FormItem><FormLabel>Amenities</FormLabel><FormControl><Input placeholder="e.g. WiFi, TV, Air Conditioning" disabled={mutation.isPending} value={field.value?.join(', ') || ''} onChange={(e) => { const val = e.target.value; field.onChange(val ? val.split(',').map(s => s.trim()).filter(Boolean) : null); }} /></FormControl><FormMessage /></FormItem>)} />
                </>)}

                {businessTypeId && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium">Custom Fields</p>
                    <CustomFieldsRenderer
                      businessTypeId={businessTypeId}
                      values={customFieldValues}
                      onChange={setCustomFieldValues}
                      disabled={mutation.isPending}
                    />
                  </>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Save Changes</Button>
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
        isUploading={uploadMutation.isPending}
        title="Crop Service Image"
        description="Adjust and crop the service image"
        saveLabel="Upload Image"
        cropShape="rect"
      />
    </>
  );
}
