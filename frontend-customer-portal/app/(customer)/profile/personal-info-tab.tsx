'use client';

import { useState, useRef, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Camera, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { AvatarCropDialog } from '@/components/avatar-crop-dialog';
import { AddressFormFields } from '@/components/address-form-fields';
import {
  useMyProfile,
  useUpdateMyProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from '@/hooks/useCustomerProfile';
import { CustomerProfileData } from '@/types/api';

const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bio: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    region_id: z.number().nullable().optional(),
    province_id: z.number().nullable().optional(),
    city_id: z.number().nullable().optional(),
    barangay_id: z.number().nullable().optional(),
    postal_code: z.string().optional(),
  }).optional(),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

function getDefaultValues(profileData: CustomerProfileData | undefined): PersonalInfoFormValues {
  const profile = profileData?.user?.profile;
  const address = profile?.address;

  return {
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    date_of_birth: profile?.date_of_birth || '',
    gender: (profile?.gender as PersonalInfoFormValues['gender']) || undefined,
    bio: profile?.bio || '',
    address: {
      street: address?.street || '',
      region_id: address?.region?.id ?? null,
      province_id: address?.province?.id ?? null,
      city_id: address?.city?.id ?? null,
      barangay_id: address?.barangay?.id ?? null,
      postal_code: address?.postal_code || '',
    },
  };
}

export function PersonalInfoTab() {
  const { data: profileResponse, isLoading: profileLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileData = profileResponse?.data;
  const userProfile = profileData?.user?.profile;
  const avatarUrl = userProfile?.avatar?.thumb || userProfile?.avatar?.preview || userProfile?.avatar?.original;

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: getDefaultValues(profileData),
    values: getDefaultValues(profileData),
  });

  const onSubmit = async (values: PersonalInfoFormValues) => {
    try {
      const payload: Record<string, unknown> = {
        first_name: values.first_name,
        last_name: values.last_name,
      };

      if (values.phone !== undefined) payload.phone = values.phone;
      if (values.date_of_birth !== undefined) payload.date_of_birth = values.date_of_birth;
      if (values.gender !== undefined) payload.gender = values.gender;
      if (values.bio !== undefined) payload.bio = values.bio;

      if (values.address) {
        const addr = values.address;
        if (addr.street !== undefined) payload.street = addr.street;
        if (addr.region_id !== undefined) payload.region_id = addr.region_id;
        if (addr.province_id !== undefined) payload.province_id = addr.province_id;
        if (addr.city_id !== undefined) payload.city_id = addr.city_id;
        if (addr.barangay_id !== undefined) payload.barangay_id = addr.barangay_id;
        if (addr.postal_code !== undefined) payload.postal_code = addr.postal_code;
      }

      await updateProfile.mutateAsync(payload as Parameters<typeof updateProfile.mutateAsync>[0]);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCropComplete = useCallback(async (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success('Avatar updated successfully');
      setCropDialogOpen(false);
      setCropImageSrc(null);
    } catch {
      toast.error('Failed to upload avatar');
    }
  }, [uploadAvatar]);

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar.mutateAsync();
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    }
  };

  const getInitials = () => {
    const firstName = profileData?.user?.profile?.first_name || '';
    const lastName = profileData?.user?.profile?.last_name || '';
    const name = profileData?.user?.name || '';

    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  if (profileLoading) {
    return (
      <Card className="shadow-warm border-0">
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        isUploading={uploadAvatar.isPending}
        title="Crop Profile Picture"
        description="Adjust and crop your profile picture"
        saveLabel="Save Photo"
        cropShape="round"
        aspect={1}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      <Card className="shadow-warm border-0">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)]">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} alt="Profile photo" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {avatarUrl ? <User className="h-8 w-8" /> : getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-sm font-medium">Profile Photo</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Change
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteAvatar}
                    disabled={deleteAvatar.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    {deleteAvatar.isPending ? (
                      <Spinner className="h-4 w-4 mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="+63 900 000 0000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth */}
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(new Date(field.value), 'PPP')
                              : 'Pick a date'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                            setCalendarOpen(false);
                          }}
                          captionLayout="dropdown"
                          fromYear={1920}
                          toYear={new Date().getFullYear() - 10}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
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
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Tell us a little about yourself..."
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Address Fields */}
              <div>
                <h3 className="text-sm font-medium mb-3">Address</h3>
                <AddressFormFields control={form.control} namePrefix="address" />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending && <Spinner className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </>
  );
}
