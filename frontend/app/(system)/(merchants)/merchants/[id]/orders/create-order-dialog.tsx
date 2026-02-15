'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateServiceOrder } from '@/hooks/useServiceOrders';
import { useMerchantServices } from '@/hooks/useMerchants';
import { createServiceOrderSchema, type CreateServiceOrderFormData } from '@/lib/validations';
import { ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Spinner } from '@/components/ui/spinner';
import { AxiosError } from 'axios';

interface Props {
  merchantId: number;
  serviceMerchantId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNIT_LABEL_OPTIONS = ['kg', 'pcs', 'gal', 'load', 'lbs', 'liters', 'meters', 'hours'];

export function CreateOrderDialog({ merchantId, serviceMerchantId, open, onOpenChange }: Props) {
  const mutation = useCreateServiceOrder();
  const { data: servicesData } = useMerchantServices(serviceMerchantId ?? merchantId, { per_page: 100, 'filter[service_type]': 'sellable' });
  const activeServices = (servicesData?.data || []).filter((s) => s.is_active);

  const form = useForm<CreateServiceOrderFormData>({
    resolver: zodResolver(createServiceOrderSchema),
    defaultValues: { service_id: 0, quantity: 1, unit_label: '', notes: '' },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = (data: CreateServiceOrderFormData) => {
    const payload = {
      ...data,
      notes: data.notes || undefined,
    };
    mutation.mutate({ merchantId, data: payload }, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateServiceOrderFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to create order' });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Service Order</DialogTitle>
          <DialogDescription>Create a new service order for this merchant.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (
                <Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>
              )}

              <FormField control={form.control} name="service_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    disabled={mutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeServices.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name} (${s.price})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" disabled={mutation.isPending} {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unit_label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Label</FormLabel>
                    <Select
                      value={UNIT_LABEL_OPTIONS.includes(field.value) ? field.value : '__custom'}
                      onValueChange={(v) => field.onChange(v === '__custom' ? '' : v)}
                      disabled={mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_LABEL_OPTIONS.map((label) => (
                          <SelectItem key={label} value={label}>{label}</SelectItem>
                        ))}
                        <SelectItem value="__custom">Other...</SelectItem>
                      </SelectContent>
                    </Select>
                    {(!UNIT_LABEL_OPTIONS.includes(field.value) && field.value !== '') && (
                      <Input
                        placeholder="Custom unit label"
                        disabled={mutation.isPending}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea disabled={mutation.isPending} {...field} value={field.value || ''} placeholder="Optional notes..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                {mutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
