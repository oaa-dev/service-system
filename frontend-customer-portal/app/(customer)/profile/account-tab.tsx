'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ShieldCheck, Mail, KeyRound, AlertTriangle, FileText, Upload } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuthStore } from '@/stores/authStore';
import {
  useChangePassword,
  useMyProfile,
  useMyCustomerRecord,
  useUploadIdentityDocument,
} from '@/hooks/useCustomerProfile';

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

function VerificationBadge({
  emailVerifiedAt,
  identityVerifiedAt,
  identityDocumentStatus,
}: {
  emailVerifiedAt: string | null | undefined;
  identityVerifiedAt?: string | null;
  identityDocumentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
}) {
  if (identityVerifiedAt) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
        Fully Verified
      </Badge>
    );
  }

  if (identityDocumentStatus === 'pending') {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
        Pending Review
      </Badge>
    );
  }

  if (emailVerifiedAt) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
        Email Verified
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
      Unverified
    </Badge>
  );
}

export function AccountTab() {
  const { user } = useAuthStore();
  const { data: profileResponse } = useMyProfile();
  const { data: customerRecordResponse } = useMyCustomerRecord();
  const changePassword = useChangePassword();
  const uploadIdentityDocument = useUploadIdentityDocument();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileData = profileResponse?.data;
  const emailVerifiedAt = profileData?.user?.email_verified_at;
  const customerRecord = customerRecordResponse?.data;
  const identityDocumentStatus = customerRecord?.identity_document_status;
  const identityVerifiedAt = customerRecord?.identity_verified_at;

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setPasswordError(null);
    try {
      await changePassword.mutateAsync({
        current_password: values.current_password,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      toast.success('Password changed successfully');
      form.reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const apiError = err?.response?.data;
      if (apiError?.errors?.current_password) {
        setPasswordError(apiError.errors.current_password[0]);
      } else if (apiError?.message) {
        setPasswordError(apiError.message);
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadIdentityDocument.mutateAsync(selectedFile);
      toast.success('Document uploaded successfully');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      toast.error('Failed to upload document');
    }
  };

  const canUpload = identityDocumentStatus === 'none' || identityDocumentStatus === 'rejected';

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <Card className="shadow-warm border-0">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)]">Account Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <VerificationBadge
              emailVerifiedAt={emailVerifiedAt}
              identityVerifiedAt={identityVerifiedAt}
              identityDocumentStatus={identityDocumentStatus}
            />
          </div>

          {!emailVerifiedAt && (
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Your email address is not verified. Verify your email to unlock payment setup and full platform features.
              </p>
            </div>
          )}

          {!!emailVerifiedAt && (
            <p className="text-sm text-muted-foreground">
              Your email has been verified. Complete identity verification to access all platform features.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Identity Verification */}
      <Card className="shadow-warm border-0">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)] text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-3">
            {identityDocumentStatus === 'approved' && (
              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Verified
              </Badge>
            )}
            {identityDocumentStatus === 'pending' && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                Under Review
              </Badge>
            )}
            {identityDocumentStatus === 'rejected' && (
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Rejected
              </Badge>
            )}
            {(identityDocumentStatus === 'none' || !identityDocumentStatus) && (
              <Badge variant="outline" className="text-muted-foreground">
                Not Submitted
              </Badge>
            )}
          </div>

          {/* Approved state */}
          {identityDocumentStatus === 'approved' && (
            <p className="text-sm text-muted-foreground">
              Your identity has been verified.
            </p>
          )}

          {/* Pending state */}
          {identityDocumentStatus === 'pending' && (
            <p className="text-sm text-muted-foreground">
              Your document is under review. We will notify you once the review is complete.
            </p>
          )}

          {/* Upload section for none or rejected */}
          {canUpload && (
            <div className="space-y-3">
              {identityDocumentStatus === 'rejected' && (
                <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    Your previous document was rejected. Please upload a new government ID.
                  </p>
                </div>
              )}

              {(identityDocumentStatus === 'none' || !identityDocumentStatus) && (
                <p className="text-sm text-muted-foreground">
                  Upload a government-issued ID (passport, driver&apos;s license, etc.)
                </p>
              )}

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Accepted formats: JPG, JPEG, PNG, PDF. Maximum file size: 5MB.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadIdentityDocument.isPending}
                >
                  {uploadIdentityDocument.isPending ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Document
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email */}
      <Card className="shadow-warm border-0">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)] text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 rounded-md border bg-muted text-sm text-muted-foreground">
              {user?.email || 'No email on file'}
            </div>
            <Badge variant="outline" className="text-xs shrink-0">Read-only</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Contact support if you need to change your email address.
          </p>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="shadow-warm border-0">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)] text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your current password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="At least 8 characters"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Repeat your new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {passwordError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {passwordError}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending && <Spinner className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
