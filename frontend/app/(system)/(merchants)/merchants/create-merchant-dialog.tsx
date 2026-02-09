'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMerchant, useAllMerchants } from '@/hooks/useMerchants';
import { useActiveBusinessTypes } from '@/hooks/useBusinessTypes';
import { createMerchantSchema, type CreateMerchantFormData } from '@/lib/validations';
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

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export function CreateMerchantDialog({ open, onOpenChange }: Props) {
  const mutation = useCreateMerchant();
  const { data: businessTypesData } = useActiveBusinessTypes();
  const { data: allMerchantsData } = useAllMerchants();

  const form = useForm<CreateMerchantFormData>({
    resolver: zodResolver(createMerchantSchema),
    defaultValues: {
      user_name: '', user_email: '', user_password: '',
      name: '', type: 'individual', description: '',
      contact_phone: '', business_type_id: null, parent_id: null,
    },
  });

  useEffect(() => { if (!open) form.reset(); }, [open, form]);

  const businessTypes = businessTypesData?.data || [];
  const allMerchants = allMerchantsData?.data || [];
  const watchType = form.watch('type');

  const onSubmit = (data: CreateMerchantFormData) => {
    const cleaned = {
      ...data,
      business_type_id: data.business_type_id || undefined,
      parent_id: data.parent_id || undefined,
    };
    mutation.mutate(cleaned, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateMerchantFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to create merchant' });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Merchant</DialogTitle><DialogDescription>Register a new merchant account with a user.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">User Account</p>
                <FormField control={form.control} name="user_name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="user_email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="user_password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="business_type_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === '__none__' ? null : parseInt(v))} value={field.value ? String(field.value) : '__none__'}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {businessTypes.map((bt) => (<SelectItem key={bt.id} value={String(bt.id)}>{bt.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {watchType === 'organization' && (
                <FormField control={form.control} name="parent_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Merchant</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === '__none__' ? null : parseInt(v))} value={field.value ? String(field.value) : '__none__'}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {allMerchants.map((m) => (<SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="contact_phone" render={({ field }) => (
                <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Create Merchant</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
