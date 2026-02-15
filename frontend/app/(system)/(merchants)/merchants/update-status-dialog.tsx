'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateMerchantStatus } from '@/hooks/useMerchants';
import { updateMerchantStatusSchema, type UpdateMerchantStatusFormData } from '@/lib/validations';
import { Merchant, MerchantStatus, merchantStatusLabels, ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { AxiosError } from 'axios';

const VALID_TRANSITIONS: Record<MerchantStatus, MerchantStatus[]> = {
  pending: ['submitted'],
  submitted: ['approved', 'rejected'],
  approved: ['active', 'suspended'],
  active: ['suspended'],
  rejected: ['pending'],
  suspended: ['active'],
};

const statusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500',
  submitted: 'bg-orange-500',
  approved: 'bg-blue-500',
  active: 'bg-emerald-500',
  rejected: 'bg-red-500',
  suspended: 'bg-gray-500',
};

interface Props { item: Merchant | null; open: boolean; onOpenChange: (open: boolean) => void; }

export function UpdateStatusDialog({ item, open, onOpenChange }: Props) {
  const mutation = useUpdateMerchantStatus();

  const form = useForm<UpdateMerchantStatusFormData>({
    resolver: zodResolver(updateMerchantStatusSchema),
    defaultValues: { status: 'pending', status_reason: '' },
  });

  const watchedStatus = form.watch('status');
  const requiresReason = watchedStatus === 'rejected' || watchedStatus === 'suspended';
  const availableTransitions = item ? (VALID_TRANSITIONS[item.status] || []) : [];

  useEffect(() => {
    if (item && open) {
      const firstTransition = VALID_TRANSITIONS[item.status]?.[0] || item.status;
      form.reset({ status: firstTransition, status_reason: '' });
    }
  }, [item, open, form]);

  const onSubmit = (data: UpdateMerchantStatusFormData) => {
    if (!item) return;
    mutation.mutate({ id: item.id, data }, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        form.setError('root', { message: axiosError.response?.data?.message || 'Failed to update status' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Merchant Status</DialogTitle>
          <DialogDescription>
            Change status for <span className="font-semibold">{item?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current status:</span>
                <Badge className={item ? statusColors[item.status] : ''}>{item ? merchantStatusLabels[item.status] : ''}</Badge>
              </div>

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {availableTransitions.map((s) => (
                        <SelectItem key={s} value={s}>{merchantStatusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {requiresReason && (
                <FormField control={form.control} name="status_reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl><Textarea placeholder="Provide a reason..." disabled={mutation.isPending} {...field} /></FormControl>
                    <FormDescription>Required for rejection and suspension.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Update Status</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
