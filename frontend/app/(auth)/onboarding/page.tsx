'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelectMerchantType } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { selectMerchantTypeSchema, type SelectMerchantTypeFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { User, Building2, ArrowRight, Check } from 'lucide-react';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const selectMerchantType = useSelectMerchantType();
  const [selectedType, setSelectedType] = useState<'individual' | 'organization' | null>(null);

  const form = useForm<SelectMerchantTypeFormData>({
    resolver: zodResolver(selectMerchantTypeSchema),
    defaultValues: {
      type: undefined,
      name: '',
    },
  });

  // Redirect guards
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user) {
        // Only merchant role users should see this page
        const isMerchantRole = user.roles?.includes('merchant');
        if (!isMerchantRole) {
          router.push('/dashboard');
          return;
        }
        if (!user.email_verified_at) {
          router.push('/verify-email');
          return;
        }
        if (user.has_merchant) {
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleCardClick = (type: 'individual' | 'organization') => {
    setSelectedType(type);
    form.setValue('type', type);
    form.clearErrors('type');
  };

  const onSubmit = (data: SelectMerchantTypeFormData) => {
    selectMerchantType.mutate(data, {
      onSuccess: () => {
        router.push('/dashboard');
      },
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof SelectMerchantTypeFormData, {
              message: Array.isArray(value) ? value[0] : value,
            });
          });
        } else {
          form.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to set up your account. Please try again.',
          });
        }
      },
    });
  };

  // Show loading while checking auth
  if (isLoading || !user) {
    return (
      <div className="w-full max-w-lg flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Set up your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your merchant type to get started
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {form.formState.errors.root && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}

          {/* Type selection cards */}
          <FormField
            control={form.control}
            name="type"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-2 gap-4">
                  {/* Individual card */}
                  <button
                    type="button"
                    onClick={() => handleCardClick('individual')}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all',
                      'hover:border-primary/50 hover:bg-muted/50',
                      selectedType === 'individual'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-muted'
                    )}
                  >
                    {selectedType === 'individual' && (
                      <div className="absolute right-3 top-3">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Individual</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        I&apos;m a sole proprietor or freelancer
                      </div>
                    </div>
                  </button>

                  {/* Organization card */}
                  <button
                    type="button"
                    onClick={() => handleCardClick('organization')}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-all',
                      'hover:border-primary/50 hover:bg-muted/50',
                      selectedType === 'organization'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-muted'
                    )}
                  >
                    {selectedType === 'organization' && (
                      <div className="absolute right-3 top-3">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">Organization</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        I represent a company or business
                      </div>
                    </div>
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Business name input */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your business or brand name"
                    className="h-10"
                    disabled={selectMerchantType.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full h-10"
            disabled={!selectedType || selectMerchantType.isPending}
          >
            {selectMerchantType.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Setting up your account...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
