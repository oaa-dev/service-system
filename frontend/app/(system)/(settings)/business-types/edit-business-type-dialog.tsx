'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateBusinessType, useSyncBusinessTypeFields } from '@/hooks/useBusinessTypes';
import { updateBusinessTypeSchema, type UpdateBusinessTypeFormData } from '@/lib/validations';
import { BusinessType, ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { FieldLinker, type LinkedFieldData } from './field-linker';
import { AxiosError } from 'axios';

interface Props { item: BusinessType | null; open: boolean; onOpenChange: (open: boolean) => void; }

export function EditBusinessTypeDialog({ item, open, onOpenChange }: Props) {
  const mutation = useUpdateBusinessType();
  const syncFieldsMutation = useSyncBusinessTypeFields();
  const linkedFieldsRef = useRef<LinkedFieldData[]>([]);

  const form = useForm<UpdateBusinessTypeFormData>({
    resolver: zodResolver(updateBusinessTypeSchema),
    defaultValues: { name: '', description: '', is_active: true, sort_order: 0, can_sell_products: false, can_take_bookings: false, can_rent_units: false },
  });

  useEffect(() => {
    if (item && open) {
      form.reset({ name: item.name, description: item.description || '', is_active: item.is_active, sort_order: item.sort_order, can_sell_products: item.can_sell_products, can_take_bookings: item.can_take_bookings, can_rent_units: item.can_rent_units });
    }
  }, [item, open, form]);

  const handleFieldsChange = useCallback((fields: LinkedFieldData[]) => {
    linkedFieldsRef.current = fields;
  }, []);

  const onSubmit = async (data: UpdateBusinessTypeFormData) => {
    if (!item) return;
    try {
      await new Promise<void>((resolve, reject) => {
        mutation.mutate({ id: item.id, data }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });

      await new Promise<void>((resolve, reject) => {
        syncFieldsMutation.mutate(
          { businessTypeId: item.id, data: { fields: linkedFieldsRef.current } },
          { onSuccess: () => resolve(), onError: (error) => reject(error) }
        );
      });

      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      if (axiosError.response?.data?.errors) {
        Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
          form.setError(key as keyof UpdateBusinessTypeFormData, { message: Array.isArray(value) ? value[0] : value });
        });
      } else {
        form.setError('root', { message: axiosError.response?.data?.message || 'Failed to update business type' });
      }
    }
  };

  const isBusy = mutation.isPending || syncFieldsMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Business Type</DialogTitle><DialogDescription>Update business type details.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input disabled={isBusy} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea disabled={isBusy} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sort_order" render={({ field }) => (<FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input type="number" disabled={isBusy} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-2"><FormLabel>Active</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isBusy} /></FormControl></FormItem>
                )} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Capabilities</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="can_sell_products" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel className="text-xs">Sell Products</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isBusy} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="can_take_bookings" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel className="text-xs">Take Bookings</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isBusy} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="can_rent_units" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3"><FormLabel className="text-xs">Rent Units</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isBusy} /></FormControl></FormItem>
                  )} />
                </div>
              </div>
              <Separator />
              <FieldLinker businessTypeId={item?.id ?? 0} disabled={isBusy} onFieldsChange={handleFieldsChange} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>Cancel</Button>
              <Button type="submit" disabled={isBusy}>{isBusy && <Spinner className="mr-2 h-4 w-4" />}Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
