'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@/hooks/useProfile';
import { useCustomerProfile, useUpdateCustomerPreferences } from '@/hooks/useCustomers';
import { useUpdateMe } from '@/hooks/useAuth';
import {
  updateProfileSchema,
  updateAccountSchema,
  updateCustomerPreferencesSchema,
  type UpdateProfileFormData,
  type UpdateAccountFormData,
  type UpdateCustomerPreferencesFormData,
} from '@/lib/validations';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Shield,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { AddressFormFields } from '@/components/address-form-fields';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: profileData } = useProfile();
  const { data: customerData } = useCustomerProfile();
  const updateProfile = useUpdateProfile();
  const updateMe = useUpdateMe();
  const updateCustomerPrefs = useUpdateCustomerPreferences();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomer = user?.roles?.includes('customer');

  // Avatar crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedAvatarPreview, setUploadedAvatarPreview] = useState<string | null>(null);

  const profile = profileData?.data;
  const customerProfile = customerData?.data;

  // Account form
  const accountForm = useForm<UpdateAccountFormData>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    },
  });

  // Profile form
  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
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

  // Customer preferences form
  const preferencesForm = useForm<UpdateCustomerPreferencesFormData>({
    resolver: zodResolver(updateCustomerPreferencesSchema),
    defaultValues: {
      preferred_payment_method: null,
      communication_preference: 'both',
    },
  });

  // Update account form when user changes
  useEffect(() => {
    if (user) {
      accountForm.reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
      });
    }
  }, [user, accountForm]);

  // Update profile form when profile data loads
  useEffect(() => {
    if (profile) {
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
  }, [profile, profileForm]);

  // Update preferences form when customer profile data loads
  useEffect(() => {
    if (customerProfile) {
      preferencesForm.reset({
        preferred_payment_method: customerProfile.preferred_payment_method || null,
        communication_preference: customerProfile.communication_preference || 'both',
      });
    }
  }, [customerProfile, preferencesForm]);

  const onPreferencesSubmit = (data: UpdateCustomerPreferencesFormData) => {
    updateCustomerPrefs.mutate(data, {
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        preferencesForm.setError('root', {
          message: axiosError.response?.data?.message || 'Failed to update preferences',
        });
      },
    });
  };

  const onAccountSubmit = (data: UpdateAccountFormData) => {
    updateMe.mutate(data, {
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            accountForm.setError(key as keyof UpdateAccountFormData, {
              message: Array.isArray(value) ? value[0] : value,
            });
          });
        } else {
          accountForm.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to update account',
          });
        }
      },
    });
  };

  const onProfileSubmit = (data: UpdateProfileFormData) => {
    // Transform data to match API expectations (convert nulls to undefined for address)
    const transformedData = {
      ...data,
      address: data.address ? {
        street: data.address.street || undefined,
        region_id: data.address.region_id ?? undefined,
        province_id: data.address.province_id ?? undefined,
        city_id: data.address.city_id ?? undefined,
        barangay_id: data.address.barangay_id ?? undefined,
        postal_code: data.address.postal_code || undefined,
      } : undefined,
    };

    updateProfile.mutate(transformedData, {
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            profileForm.setError(key as keyof UpdateProfileFormData, {
              message: Array.isArray(value) ? value[0] : value,
            });
          });
        } else {
          profileForm.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to update profile',
          });
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
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = useCallback((croppedImageBlob: Blob) => {
    // Create preview URL immediately
    const previewUrl = URL.createObjectURL(croppedImageBlob);

    const file = new File([croppedImageBlob], 'avatar.jpg', {
      type: 'image/jpeg',
    });
    uploadAvatar.mutate(file, {
      onSuccess: () => {
        // Clean up old preview if exists
        if (uploadedAvatarPreview) {
          URL.revokeObjectURL(uploadedAvatarPreview);
        }
        setUploadedAvatarPreview(previewUrl);
        setCropDialogOpen(false);
        setSelectedImage(null);
      },
      onError: () => {
        // Clean up preview URL on error
        URL.revokeObjectURL(previewUrl);
      },
    });
  }, [uploadAvatar, uploadedAvatarPreview]);

  const handleAvatarDelete = () => {
    deleteAvatar.mutate(undefined, {
      onSuccess: () => {
        if (uploadedAvatarPreview) {
          URL.revokeObjectURL(uploadedAvatarPreview);
          setUploadedAvatarPreview(null);
        }
      },
    });
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedAvatarPreview) {
        URL.revokeObjectURL(uploadedAvatarPreview);
      }
    };
  }, [uploadedAvatarPreview]);

  const avatarUrl = uploadedAvatarPreview || user?.avatar?.preview || user?.profile?.avatar?.preview || profile?.avatar?.preview;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and personal information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                    <AvatarImage src={avatarUrl} alt={user?.name} />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploadAvatar.isPending ? (
                      <Spinner className="h-6 w-6 text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {user?.email_verified_at ? (
                    <Badge variant="default" className="bg-emerald-500">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-4 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleAvatarDelete}
                      disabled={deleteAvatar.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  JPEG, PNG or WebP. Max 5MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-2">
                  <User className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-medium">{user?.name || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/10 p-2">
                  <Mail className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{user?.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-violet-500/10 p-2">
                  <Phone className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{profile?.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-500/10 p-2">
                  <MapPin className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">
                    {profile?.address?.city?.name && profile?.address?.region?.name
                      ? `${profile.address.city.name}, ${profile.address.region.name}`
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Update your account credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                  {accountForm.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>{accountForm.formState.errors.root.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={accountForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-9"
                                placeholder="John"
                                disabled={updateMe.isPending}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              disabled={updateMe.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-9"
                                type="email"
                                placeholder="john@example.com"
                                disabled={updateMe.isPending}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateMe.isPending}>
                      {updateMe.isPending && <Spinner className="mr-2 h-4 w-4" />}
                      Save Account
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Tell us more about yourself
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  {profileForm.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>{profileForm.formState.errors.root.message}</AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write a short bio about yourself..."
                            disabled={updateProfile.isPending}
                            rows={4}
                            className="resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-9"
                                placeholder="+1 (555) 000-0000"
                                disabled={updateProfile.isPending}
                                {...field}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                className="pl-9"
                                type="date"
                                disabled={updateProfile.isPending}
                                {...field}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            disabled={updateProfile.isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">Address Information</h4>
                    </div>

                    <AddressFormFields
                      control={profileForm.control}
                      namePrefix="address"
                      disabled={updateProfile.isPending}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateProfile.isPending}>
                      {updateProfile.isPending && <Spinner className="mr-2 h-4 w-4" />}
                      Save Profile
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          {/* Customer Preferences (only for customers) */}
          {isCustomer && customerProfile && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Customer Preferences</CardTitle>
                    <CardDescription>
                      Manage your payment and communication preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...preferencesForm}>
                  <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-4">
                    {preferencesForm.formState.errors.root && (
                      <Alert variant="destructive">
                        <AlertDescription>{preferencesForm.formState.errors.root.message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={preferencesForm.control}
                        name="preferred_payment_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Payment Method</FormLabel>
                            <Select
                              onValueChange={(val) => field.onChange(val || null)}
                              value={field.value || ''}
                              disabled={updateCustomerPrefs.isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="e-wallet">E-Wallet</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={preferencesForm.control}
                        name="communication_preference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Communication Preference</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ''}
                              disabled={updateCustomerPrefs.isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateCustomerPrefs.isPending}>
                        {updateCustomerPrefs.isPending && <Spinner className="mr-2 h-4 w-4" />}
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        isUploading={uploadAvatar.isPending}
      />
    </div>
  );
}
