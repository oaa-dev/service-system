'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateCustomerAccount } from '@/hooks/useCustomers';
import { Customer, ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

const accountSchema = z.object({
  email: z.string().email('Invalid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface Props { customer: Customer; }

export function CustomerAccountTab({ customer }: Props) {
  const updateMutation = useUpdateCustomerAccount();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: customer.user?.email || '',
      password: '',
    },
  });

  const onSubmit = (data: AccountFormData) => {
    const payload: { email?: string; password?: string } = {};
    if (data.email !== customer.user?.email) {
      payload.email = data.email;
    }
    if (data.password) {
      payload.password = data.password;
    }
    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save');
      return;
    }
    updateMutation.mutate({ id: customer.id, data: payload }, {
      onSuccess: () => {
        toast.success('Account updated successfully');
        form.setValue('password', '');
      },
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof AccountFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to update account' });
        }
      },
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Update the customer&apos;s login credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}

            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm font-medium">Current Owner</p>
              <p className="text-sm text-muted-foreground">{customer.user?.name} ({customer.user?.email})</p>
            </div>

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" disabled={updateMutation.isPending} {...field} /></FormControl>
                <FormDescription>Changing this will update the user&apos;s login email</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl><Input type="password" placeholder="Leave blank to keep current" disabled={updateMutation.isPending} {...field} /></FormControl>
                <FormDescription>Minimum 8 characters. Leave empty to keep the current password.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Update Account
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
