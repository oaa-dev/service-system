'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateCustomerStatus } from '@/hooks/useCustomers';
import { updateCustomerStatusSchema, type UpdateCustomerStatusFormData } from '@/lib/validations';
import { Customer, CustomerStatus, ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
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
import { AxiosError } from 'axios';

const VALID_TRANSITIONS: Record<CustomerStatus, CustomerStatus[]> = {
  active: ['suspended', 'banned'],
  suspended: ['active', 'banned'],
  banned: ['active'],
};

const statusColors: Record<CustomerStatus, string> = {
  active: 'bg-emerald-500',
  suspended: 'bg-yellow-500',
  banned: 'bg-red-500',
};

interface Props {
  item: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateCustomerStatusDialog({ item, open, onOpenChange }: Props) {
  const mutation = useUpdateCustomerStatus();

  const form = useForm<UpdateCustomerStatusFormData>({
    resolver: zodResolver(updateCustomerStatusSchema),
    defaultValues: { status: 'active' },
  });

  const availableTransitions = item ? (VALID_TRANSITIONS[item.status] || []) : [];

  useEffect(() => {
    if (item && open) {
      const firstTransition = VALID_TRANSITIONS[item.status]?.[0] || item.status;
      form.reset({ status: firstTransition });
    }
  }, [item, open, form]);

  const onSubmit = (data: UpdateCustomerStatusFormData) => {
    if (!item) return;
    mutation.mutate(
      { id: item.id, data },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>;
          form.setError('root', {
            message: axiosError.response?.data?.message || 'Failed to update status',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Customer Status</DialogTitle>
          <DialogDescription>
            Change status for <span className="font-semibold">{item?.user?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current status:</span>
                <Badge className={item ? statusColors[item.status] : ''}>{item?.status}</Badge>
              </div>

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {availableTransitions.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
