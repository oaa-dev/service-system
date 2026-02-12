'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdatePlatformFee } from '@/hooks/usePlatformFees';
import { updatePlatformFeeSchema, type UpdatePlatformFeeFormData } from '@/lib/validations';
import { PlatformFee, ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { AxiosError } from 'axios';

interface Props {
  item: PlatformFee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const transactionTypeOptions = [
  { label: 'Booking', value: 'booking' },
  { label: 'Reservation', value: 'reservation' },
  { label: 'Sell Product', value: 'sell_product' },
] as const;

export function EditPlatformFeeDialog({ item, open, onOpenChange }: Props) {
  const mutation = useUpdatePlatformFee();

  const form = useForm<UpdatePlatformFeeFormData>({
    resolver: zodResolver(updatePlatformFeeSchema),
    defaultValues: { name: '', description: '', transaction_type: 'booking', rate_percentage: 0, is_active: true, sort_order: 0 },
  });

  useEffect(() => {
    if (item && open) {
      form.reset({
        name: item.name,
        description: item.description || '',
        transaction_type: item.transaction_type,
        rate_percentage: parseFloat(item.rate_percentage),
        is_active: item.is_active,
        sort_order: item.sort_order,
      });
    }
  }, [item, open, form]);

  const onSubmit = (data: UpdatePlatformFeeFormData) => {
    if (!item) return;
    mutation.mutate(
      { id: item.id, data },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>;
          if (axiosError.response?.data?.errors) {
            Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
              form.setError(key as keyof UpdatePlatformFeeFormData, {
                message: Array.isArray(value) ? value[0] : value,
              });
            });
          } else {
            form.setError('root', {
              message: axiosError.response?.data?.message || 'Failed to update platform fee',
            });
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Platform Fee</DialogTitle>
          <DialogDescription>Update platform fee details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="transaction_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={mutation.isPending}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transactionTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rate_percentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" disabled={mutation.isPending} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sort_order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl><Input type="number" disabled={mutation.isPending} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-2">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
