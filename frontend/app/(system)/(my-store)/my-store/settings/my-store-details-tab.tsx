/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateMyMerchant, useUploadMyMerchantLogo, useDeleteMyMerchantLogo } from '@/hooks/useMyMerchant';
import { useActiveBusinessTypes } from '@/hooks/useBusinessTypes';
import { updateMerchantSchema, type UpdateMerchantFormData } from '@/lib/validations';
import { Merchant, ApiError, AddressInput } from '@/types/api';
import { AddressFormFields } from '@/components/address-form-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { Store, Trash2, Upload } from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

interface Props { merchant: Merchant; }

export function MyStoreDetailsTab({ merchant }: Props) {
  const updateMutation = useUpdateMyMerchant();
  const uploadLogoMutation = useUploadMyMerchantLogo();
  const deleteLogoMutation = useDeleteMyMerchantLogo();
  const { data: businessTypesData, isLoading: isLoadingBusinessTypes } = useActiveBusinessTypes();
  const businessTypes = businessTypesData?.data || [];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedLogoPreview, setUploadedLogoPreview] = useState<string | null>(null);

  const form = useForm<UpdateMerchantFormData>({
    resolver: zodResolver(updateMerchantSchema),
    defaultValues: {
      name: merchant.name,
      description: merchant.description || '',
      contact_phone: merchant.contact_phone || '',
      business_type_id: merchant.business_type?.id || null,
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
      description: merchant.description || '',
      contact_phone: merchant.contact_phone || '',
      business_type_id: merchant.business_type?.id || null,
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
      address: addressInput,
    };
    updateMutation.mutate(cleaned, {
      onSuccess: () => toast.success('Store details updated'),
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

    uploadLogoMutation.mutate(file, {
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
  }, [uploadLogoMutation, uploadedLogoPreview]);

  const handleLogoDelete = () => {
    deleteLogoMutation.mutate(undefined, {
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
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Upload or change your store logo</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
          <CardDescription>Update your store information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}

              {/* Business Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Type</label>
                <Select
                  value={form.watch('business_type_id') ? String(form.watch('business_type_id')) : '__none__'}
                  onValueChange={(v) => {
                    const newId = v === '__none__' ? null : parseInt(v);
                    form.setValue('business_type_id', newId);
                    if (newId) {
                      const bt = businessTypes.find((b) => b.id === newId);
                      if (bt) {
                        form.setValue('can_sell_products', bt.can_sell_products);
                        form.setValue('can_take_bookings', bt.can_take_bookings);
                        form.setValue('can_rent_units', bt.can_rent_units);
                      }
                    }
                  }}
                  disabled={updateMutation.isPending || isLoadingBusinessTypes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select a business type</SelectItem>
                    {businessTypes.map((bt) => (
                      <SelectItem key={bt.id} value={String(bt.id)}>{bt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Changing business type will update capabilities below</p>
              </div>

              {/* Capabilities */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Capabilities</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.watch('can_sell_products') ?? false}
                      onCheckedChange={(checked) => form.setValue('can_sell_products', !!checked)}
                      disabled={updateMutation.isPending}
                    />
                    <span className="text-sm">Sell Products</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.watch('can_take_bookings') ?? false}
                      onCheckedChange={(checked) => form.setValue('can_take_bookings', !!checked)}
                      disabled={updateMutation.isPending}
                    />
                    <span className="text-sm">Take Bookings</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.watch('can_rent_units') ?? false}
                      onCheckedChange={(checked) => form.setValue('can_rent_units', !!checked)}
                      disabled={updateMutation.isPending}
                    />
                    <span className="text-sm">Rent Units</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Select what your store can do</p>
              </div>

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input disabled={updateMutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea disabled={updateMutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <Separator />
              <p className="text-sm font-medium">Contact</p>

              <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input disabled={updateMutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

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

      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        isUploading={uploadLogoMutation.isPending}
        title="Crop Logo"
        description="Adjust and crop your store logo"
        saveLabel="Upload Logo"
        cropShape="rect"
      />
    </div>
  );
}
