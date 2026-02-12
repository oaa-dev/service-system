/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateMerchant, useUploadMerchantLogo, useDeleteMerchantLogo, useAllMerchants } from '@/hooks/useMerchants';
import { useActiveBusinessTypes } from '@/hooks/useBusinessTypes';
import { updateMerchantSchema, type UpdateMerchantFormData } from '@/lib/validations';
import { Merchant, ApiError, AddressInput } from '@/types/api';
import { AddressFormFields } from '@/components/address-form-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Store, Trash2, Upload } from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

interface Props { merchant: Merchant; }

export function MerchantDetailsTab({ merchant }: Props) {
  const updateMutation = useUpdateMerchant();
  const uploadLogoMutation = useUploadMerchantLogo();
  const deleteLogoMutation = useDeleteMerchantLogo();
  const { data: businessTypesData } = useActiveBusinessTypes();
  const { data: allMerchantsData } = useAllMerchants();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedLogoPreview, setUploadedLogoPreview] = useState<string | null>(null);

  const businessTypes = businessTypesData?.data || [];
  const allMerchants = (allMerchantsData?.data || []).filter((m) => m.id !== merchant.id);

  const form = useForm<UpdateMerchantFormData>({
    resolver: zodResolver(updateMerchantSchema),
    defaultValues: {
      name: merchant.name,
      type: merchant.type,
      parent_id: merchant.parent_id,
      business_type_id: merchant.business_type_id,
      description: merchant.description || '',
      contact_phone: merchant.contact_phone || '',
      can_sell_products: merchant.can_sell_products,
      can_take_bookings: merchant.can_take_bookings,
      can_rent_units: merchant.can_rent_units,
      address: {
        street: merchant.address?.street || '',
        region_id: merchant.address?.region?.id || null,
        province_id: merchant.address?.province?.id || null,
        city_id: merchant.address?.city?.id || null,
        barangay_id: merchant.address?.barangay?.id || null,
        postal_code: merchant.address?.postal_code || '',
      },
    },
  });

  useEffect(() => {
    form.reset({
      name: merchant.name,
      type: merchant.type,
      parent_id: merchant.parent_id,
      business_type_id: merchant.business_type_id,
      description: merchant.description || '',
      contact_phone: merchant.contact_phone || '',
      can_sell_products: merchant.can_sell_products,
      can_take_bookings: merchant.can_take_bookings,
      can_rent_units: merchant.can_rent_units,
      address: {
        street: merchant.address?.street || '',
        region_id: merchant.address?.region?.id || null,
        province_id: merchant.address?.province?.id || null,
        city_id: merchant.address?.city?.id || null,
        barangay_id: merchant.address?.barangay?.id || null,
        postal_code: merchant.address?.postal_code || '',
      },
    });
  }, [merchant, form]);

  const watchType = form.watch('type');

  const onSubmit = (data: UpdateMerchantFormData) => {
    const addressInput: AddressInput | undefined = data.address ? {
      street: data.address.street || undefined,
      region_id: data.address.region_id ?? undefined,
      province_id: data.address.province_id ?? undefined,
      city_id: data.address.city_id ?? undefined,
      barangay_id: data.address.barangay_id ?? undefined,
      postal_code: data.address.postal_code || undefined,
    } : undefined;
    const cleaned = {
      ...data,
      business_type_id: data.business_type_id || undefined,
      parent_id: data.parent_id || undefined,
      address: addressInput,
    };
    updateMutation.mutate({ id: merchant.id, data: cleaned }, {
      onSuccess: () => toast.success('Merchant details updated'),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof UpdateMerchantFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to update' });
        }
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = useCallback((croppedImageBlob: Blob) => {
    const previewUrl = URL.createObjectURL(croppedImageBlob);
    const file = new File([croppedImageBlob], 'logo.jpg', { type: 'image/jpeg' });

    uploadLogoMutation.mutate({ id: merchant.id, file }, {
      onSuccess: () => {
        if (uploadedLogoPreview) URL.revokeObjectURL(uploadedLogoPreview);
        setUploadedLogoPreview(previewUrl);
        setCropDialogOpen(false);
        setSelectedImage(null);
        toast.success('Logo uploaded');
      },
      onError: () => {
        URL.revokeObjectURL(previewUrl);
      },
    });
  }, [uploadLogoMutation, merchant.id, uploadedLogoPreview]);

  const handleLogoDelete = () => {
    deleteLogoMutation.mutate(merchant.id, {
      onSuccess: () => {
        if (uploadedLogoPreview) {
          URL.revokeObjectURL(uploadedLogoPreview);
          setUploadedLogoPreview(null);
        }
        toast.success('Logo deleted');
      },
    });
  };

  const logoSrc = uploadedLogoPreview || merchant.logo?.preview || merchant.logo?.url || null;
  const hasLogo = !!uploadedLogoPreview || !!merchant.logo;

  return (
    <div className="space-y-6 mt-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Upload or change the merchant logo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {logoSrc ? (
              <img src={logoSrc} alt={merchant.name} className="h-24 w-24 rounded-xl object-cover border" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted">
                <Store className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadLogoMutation.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              {hasLogo && (
                <Button type="button" variant="outline" onClick={handleLogoDelete} disabled={deleteLogoMutation.isPending}>
                  {deleteLogoMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
          <CardDescription>Update the merchant&apos;s core information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input disabled={updateMutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="business_type_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === '__none__' ? null : parseInt(v))} value={field.value ? String(field.value) : '__none__'}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {businessTypes.map((bt) => (<SelectItem key={bt.id} value={String(bt.id)}>{bt.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {watchType === 'organization' && (
                <FormField control={form.control} name="parent_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Merchant</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === '__none__' ? null : parseInt(v))} value={field.value ? String(field.value) : '__none__'}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {allMerchants.map((m) => (<SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea disabled={updateMutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <Separator />
              <p className="text-sm font-medium">Contact</p>

              <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input disabled={updateMutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <Separator />
              <div>
                <p className="text-sm font-medium">Capabilities</p>
                {merchant.business_type && (
                  <p className="text-xs text-muted-foreground mt-1">Inherited from: {merchant.business_type.name}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="can_sell_products" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Sell Products</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={updateMutation.isPending} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="can_take_bookings" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Take Bookings</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={updateMutation.isPending} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="can_rent_units" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel>Rent Units</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={updateMutation.isPending} /></FormControl></FormItem>
                )} />
              </div>

              <Separator />
              <p className="text-sm font-medium">Address</p>

              <AddressFormFields
                control={form.control}
                namePrefix="address"
                disabled={updateMutation.isPending}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                  Save Details
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Logo Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        isUploading={uploadLogoMutation.isPending}
        title="Crop Logo"
        description="Adjust and crop the merchant logo"
        saveLabel="Upload Logo"
        cropShape="rect"
      />
    </div>
  );
}
