/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUpdateCustomer, useUpdateCustomerProfile, useSyncCustomerTags, useUploadCustomerAvatar, useDeleteCustomerAvatar } from '@/hooks/useCustomers';
import { useActiveCustomerTags } from '@/hooks/useCustomerTags';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateCustomerSchema,
  updateCustomerProfileSchema,
  type UpdateCustomerFormData,
  type UpdateCustomerProfileFormData,
} from '@/lib/validations';
import { Customer, ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { MapPin, Tags, Upload, Trash2, UserCircle, Mail, Phone as PhoneIcon, Star, CreditCard, Calendar } from 'lucide-react';
import { AxiosError } from 'axios';
import { PermissionGate } from '@/components/permission-gate';
import { AddressFormFields } from '@/components/address-form-fields';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Props { customer: Customer; }

export function CustomerDetailsTab({ customer }: Props) {
  const updateCustomer = useUpdateCustomer();
  const updateCustomerProfile = useUpdateCustomerProfile();
  const syncTags = useSyncCustomerTags();
  const uploadAvatarMutation = useUploadCustomerAvatar();
  const deleteAvatarMutation = useDeleteCustomerAvatar();
  const { data: tagsData } = useActiveCustomerTags();
  const availableTags = tagsData?.data || [];
  const customerTagIds = (customer.tags || []).map((t) => t.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedAvatarPreview, setUploadedAvatarPreview] = useState<string | null>(null);

  // Customer edit form
  const editForm = useForm<UpdateCustomerFormData>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      customer_type: customer.customer_type,
      company_name: customer.company_name || '',
      customer_notes: customer.customer_notes || '',
      loyalty_points: customer.loyalty_points,
      customer_tier: customer.customer_tier,
      preferred_payment_method: customer.preferred_payment_method || null,
      communication_preference: customer.communication_preference,
    },
  });

  // Profile form
  const profileForm = useForm<UpdateCustomerProfileFormData>({
    resolver: zodResolver(updateCustomerProfileSchema),
    defaultValues: {
      bio: '',
      phone: '',
      date_of_birth: '',
      gender: null,
      address: {
        street: '',
        region_id: null,
        province_id: null,
        city_id: null,
        barangay_id: null,
        postal_code: '',
      },
    },
  });

  // Populate forms when customer data changes
  const populateEditForm = useCallback(() => {
    editForm.reset({
      customer_type: customer.customer_type,
      company_name: customer.company_name || '',
      customer_notes: customer.customer_notes || '',
      loyalty_points: customer.loyalty_points,
      customer_tier: customer.customer_tier,
      preferred_payment_method: customer.preferred_payment_method || null,
      communication_preference: customer.communication_preference,
    });
  }, [customer, editForm]);

  useState(() => { populateEditForm(); });

  useEffect(() => {
    if (customer.user?.profile) {
      const profile = customer.user.profile;
      profileForm.reset({
        bio: profile.bio || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || null,
        address: {
          street: profile.address?.street || '',
          region_id: profile.address?.region?.id || null,
          province_id: profile.address?.province?.id || null,
          city_id: profile.address?.city?.id || null,
          barangay_id: profile.address?.barangay?.id || null,
          postal_code: profile.address?.postal_code || '',
        },
      });
    }
  }, [customer, profileForm]);

  const onEditSubmit = (formData: UpdateCustomerFormData) => {
    updateCustomer.mutate(
      { id: customer.id, data: formData },
      {
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>;
          editForm.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to update customer',
          });
        },
      }
    );
  };

  const onProfileSubmit = (formData: UpdateCustomerProfileFormData) => {
    const transformedData = {
      ...formData,
      address: formData.address ? {
        street: formData.address.street || undefined,
        region_id: formData.address.region_id ?? undefined,
        province_id: formData.address.province_id ?? undefined,
        city_id: formData.address.city_id ?? undefined,
        barangay_id: formData.address.barangay_id ?? undefined,
        postal_code: formData.address.postal_code || undefined,
      } : undefined,
    };
    updateCustomerProfile.mutate(
      { id: customer.id, data: transformedData },
      {
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>;
          profileForm.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to update profile',
          });
        },
      }
    );
  };

  const handleTagToggle = (tagId: number) => {
    const currentTagIds = (customer.tags || []).map((t) => t.id);
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    syncTags.mutate({ id: customer.id, data: { tag_ids: newTagIds } });
  };

  // Avatar handlers
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
    const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });

    uploadAvatarMutation.mutate({ id: customer.id, file }, {
      onSuccess: () => {
        if (uploadedAvatarPreview) URL.revokeObjectURL(uploadedAvatarPreview);
        setUploadedAvatarPreview(previewUrl);
        setCropDialogOpen(false);
        setSelectedImage(null);
        toast.success('Avatar uploaded');
      },
      onError: () => {
        URL.revokeObjectURL(previewUrl);
      },
    });
  }, [uploadAvatarMutation, customer.id, uploadedAvatarPreview]);

  const handleAvatarDelete = () => {
    deleteAvatarMutation.mutate(customer.id, {
      onSuccess: () => {
        if (uploadedAvatarPreview) {
          URL.revokeObjectURL(uploadedAvatarPreview);
          setUploadedAvatarPreview(null);
        }
        toast.success('Avatar deleted');
      },
    });
  };

  const avatarSrc = uploadedAvatarPreview || customer.user?.profile?.avatar?.preview || customer.user?.profile?.avatar?.original || null;
  const hasAvatar = !!uploadedAvatarPreview || !!customer.user?.profile?.avatar;

  return (
    <div className="space-y-6 mt-6">
      {/* Avatar & Quick Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-6">
            {/* Avatar + Upload */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              {avatarSrc ? (
                <img src={avatarSrc} alt={customer.user?.name || 'Customer'} className="h-24 w-24 rounded-full object-cover border" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <PermissionGate permission="customers.update">
                <div className="flex gap-1">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatarMutation.isPending}>
                    <Upload className="mr-1 h-3 w-3" />
                    Upload
                  </Button>
                  {hasAvatar && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleAvatarDelete} disabled={deleteAvatarMutation.isPending}>
                      {deleteAvatarMutation.isPending ? <Spinner className="mr-1 h-3 w-3" /> : <Trash2 className="mr-1 h-3 w-3" />}
                      Remove
                    </Button>
                  )}
                </div>
              </PermissionGate>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{customer.user?.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium truncate">{customer.user?.profile?.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Points</p>
                  <p className="text-sm font-medium">{customer.loyalty_points.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="text-sm font-medium capitalize">{customer.preferred_payment_method || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium truncate">
                    {customer.user?.profile?.address?.city?.name && customer.user?.profile?.address?.region?.name
                      ? `${customer.user.profile.address.city.name}, ${customer.user.profile.address.region.name}`
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{customer.created_at ? formatDate(customer.created_at) : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details */}
      <PermissionGate permission="customers.update">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>Update customer-specific fields</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                {editForm.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>{editForm.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="customer_type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="company_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input disabled={updateCustomer.isPending} {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="customer_tier" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="loyalty_points" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyalty Points</FormLabel>
                      <FormControl><Input type="number" disabled={updateCustomer.isPending} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="preferred_payment_method" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === '__none__' ? null : v)} value={field.value || '__none__'}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="e-wallet">E-Wallet</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="communication_preference" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={editForm.control} name="customer_notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea rows={3} disabled={updateCustomer.isPending} {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateCustomer.isPending}>
                    {updateCustomer.isPending && <Spinner className="mr-2 h-4 w-4" />}
                    Save Customer
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Profile & Address */}
      <PermissionGate permission="customers.update">
        <Card>
          <CardHeader>
            <CardTitle>Profile & Address</CardTitle>
            <CardDescription>Update customer&apos;s personal information and address</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...profileForm}>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  {profileForm.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>{profileForm.formState.errors.root.message}</AlertDescription>
                    </Alert>
                  )}

                  <FormField control={profileForm.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl><Textarea rows={2} disabled={updateCustomerProfile.isPending} {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input disabled={updateCustomerProfile.isPending} {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="date_of_birth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl><Input type="date" disabled={updateCustomerProfile.isPending} {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={updateCustomerProfile.isPending}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium text-sm">Address</h4>
                    </div>
                    <AddressFormFields
                      control={profileForm.control}
                      namePrefix="address"
                      disabled={updateCustomerProfile.isPending}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateCustomerProfile.isPending}>
                      {updateCustomerProfile.isPending && <Spinner className="mr-2 h-4 w-4" />}
                      Save Profile
                    </Button>
                  </div>
                </form>
              </Form>
            </FormProvider>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Tags */}
      <PermissionGate permission="customers.update">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Tags</CardTitle>
            </div>
            <CardDescription>Click to toggle tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = customerTagIds.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    style={isSelected && tag.color ? { backgroundColor: tag.color, borderColor: tag.color } : tag.color ? { borderColor: tag.color } : undefined}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
              {availableTags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags available</p>
              )}
            </div>
            {syncTags.isPending && <Spinner className="mt-2 h-4 w-4" />}
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        isUploading={uploadAvatarMutation.isPending}
        title="Crop Avatar"
        description="Adjust and crop the customer avatar"
        saveLabel="Upload Avatar"
      />
    </div>
  );
}
