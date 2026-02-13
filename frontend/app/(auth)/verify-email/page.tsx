'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { useVerifyOtp, useResendOtp, useLogout } from '@/hooks/useAuth';
import { verifyOtpSchema, type VerifyOtpFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Mail, RefreshCw } from 'lucide-react';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
};

const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
  const logout = useLogout();
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  const form = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Redirect guards
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.email_verified_at) {
      const isMerchantRole = user.roles?.includes('merchant');
      if (isMerchantRole && user.has_merchant === false) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const onComplete = (value: string) => {
    if (value.length === 6) {
      verifyOtp.mutate(
        { otp: value },
        {
          onSuccess: () => {
            const isMerchantRole = user?.roles?.includes('merchant');
            if (isMerchantRole && user?.has_merchant === false) {
              router.push('/onboarding');
            } else {
              router.push('/dashboard');
            }
          },
          onError: (error) => {
            form.setValue('otp', '');
            const axiosError = error as AxiosError<ApiError>;
            if (axiosError.response?.data?.errors) {
              Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
                form.setError(key as keyof VerifyOtpFormData, {
                  message: Array.isArray(value) ? value[0] : value,
                });
              });
            } else {
              form.setError('root', {
                message: axiosError.response?.data?.message || 'Verification failed. Please try again.',
              });
            }
          },
        }
      );
    }
  };

  const handleResend = () => {
    resendOtp.mutate(undefined, {
      onSuccess: () => {
        setCountdown(300); // Reset to 5 minutes
        form.clearErrors();
        form.setValue('otp', '');
      },
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        form.setError('root', {
          message: axiosError.response?.data?.message || 'Failed to resend code. Please try again.',
        });
      },
    });
  };

  const handleLogout = () => {
    logout.mutate();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const canResend = countdown === 0;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a 6-digit code to <strong>{maskEmail(user.email)}</strong>
        </p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          {form.formState.errors.root && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      onComplete={onComplete}
                      disabled={verifyOtp.isPending}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormControl>
                <FormMessage className="text-center" />
              </FormItem>
            )}
          />

          {verifyOtp.isPending && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              <span>Verifying...</span>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center gap-2">
              {!canResend && (
                <p className="text-sm text-muted-foreground">
                  Resend code in <strong className="font-mono">{formatCountdown(countdown)}</strong>
                </p>
              )}
              {canResend && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={resendOtp.isPending}
                  className="gap-2"
                >
                  {resendOtp.isPending ? (
                    <>
                      <Spinner className="h-3.5 w-3.5" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resend verification code
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different account
              </button>
            </div>
          </div>
        </form>
      </Form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Didn&apos;t receive the code? Check your spam folder or try resending.
      </p>
    </div>
  );
}
