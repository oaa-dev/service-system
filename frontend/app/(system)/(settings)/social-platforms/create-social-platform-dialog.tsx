'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSocialPlatform } from '@/hooks/useSocialPlatforms';
import { createSocialPlatformSchema, type CreateSocialPlatformFormData } from '@/lib/validations';
import { ApiError } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { AxiosError } from 'axios';

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export function CreateSocialPlatformDialog({ open, onOpenChange }: Props) {
  const mutation = useCreateSocialPlatform();
  const form = useForm<CreateSocialPlatformFormData>({
    resolver: zodResolver(createSocialPlatformSchema),
    defaultValues: { name: '', base_url: '', is_active: true, sort_order: 0 },
  });

  useEffect(() => { if (!open) form.reset(); }, [open, form]);

  const onSubmit = (data: CreateSocialPlatformFormData) => {
    mutation.mutate(data, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        const axiosError = error as AxiosError<ApiError>;
        if (axiosError.response?.data?.errors) {
          Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateSocialPlatformFormData, { message: Array.isArray(value) ? value[0] : value });
          });
        } else {
          form.setError('root', { message: axiosError.response?.data?.message || 'Failed to create social platform' });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Social Platform</DialogTitle><DialogDescription>Add a new social media platform.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="base_url" render={({ field }) => (<FormItem><FormLabel>Base URL</FormLabel><FormControl><Input placeholder="https://facebook.com/" disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sort_order" render={({ field }) => (<FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input type="number" disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 mt-2"><FormLabel>Active</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} /></FormControl></FormItem>
                )} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
