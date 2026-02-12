'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateReservation } from '@/hooks/useReservations';
import { useMerchantServices } from '@/hooks/useMerchants';
import { createReservationSchema, type CreateReservationFormData } from '@/lib/validations';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReservationDialog({ merchantId, open, onOpenChange }: Props) {
  const mutation = useCreateReservation();
  const { data: servicesData } = useMerchantServices(merchantId, { per_page: 100, 'filter[service_type]': 'reservation' });
  const services = servicesData?.data || [];

  const form = useForm<CreateReservationFormData>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: { service_id: 0, check_in: '', check_out: '', guest_count: 1, notes: '', special_requests: '' },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const onSubmit = (data: CreateReservationFormData) => {
    const payload = {
      ...data,
      notes: data.notes || undefined,
      special_requests: data.special_requests || undefined,
    };
    mutation.mutate({ merchantId, data: payload }, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateReservationFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to create reservation' });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Reservation</DialogTitle>
          <DialogDescription>Create a new reservation for this merchant.</DialogDescription>
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
                      <SelectTrigger><SelectValue placeholder="Select a reservation service" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}{s.price_per_night ? ` (${s.price_per_night}/night)` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="check_in" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in</FormLabel>
                    <FormControl><Input type="date" disabled={mutation.isPending} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="check_out" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out</FormLabel>
                    <FormControl><Input type="date" disabled={mutation.isPending} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="guest_count" render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Count</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" disabled={mutation.isPending} {...field} value={field.value ?? 1} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea disabled={mutation.isPending} {...field} value={field.value || ''} placeholder="Optional notes..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="special_requests" render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl><Textarea disabled={mutation.isPending} {...field} value={field.value || ''} placeholder="Any special requests..." /></FormControl>
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
