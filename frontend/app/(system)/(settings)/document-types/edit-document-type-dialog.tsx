'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateDocumentType } from '@/hooks/useDocumentTypes';
import { updateDocumentTypeSchema, type UpdateDocumentTypeFormData } from '@/lib/validations';
import { DocumentType, ApiError } from '@/types/api';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { AxiosError } from 'axios';

interface Props {
  item: DocumentType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDocumentTypeDialog({ item, open, onOpenChange }: Props) {
  const mutation = useUpdateDocumentType();

  const form = useForm<UpdateDocumentTypeFormData>({
    resolver: zodResolver(updateDocumentTypeSchema),
    defaultValues: { name: '', description: '', is_required: false, level: 'organization', is_active: true, sort_order: 0 },
  });

  useEffect(() => {
    if (item && open) {
      form.reset({
        name: item.name,
        description: item.description || '',
        is_required: item.is_required,
        level: item.level,
        is_active: item.is_active,
        sort_order: item.sort_order,
      });
    }
  }, [item, open, form]);

  const onSubmit = (data: UpdateDocumentTypeFormData) => {
    if (!item) return;
    mutation.mutate(
      { id: item.id, data },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          const axiosError = error as AxiosError<ApiError>;
          if (axiosError.response?.data?.errors) {
            Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
              form.setError(key as keyof UpdateDocumentTypeFormData, { message: Array.isArray(value) ? value[0] : value });
            });
          } else {
            form.setError('root', { message: axiosError.response?.data?.message || 'Failed to update document type' });
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Document Type</DialogTitle>
          <DialogDescription>Update document type details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (<Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert>)}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea disabled={mutation.isPending} {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="organization">Organization</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sort_order" render={({ field }) => (
                  <FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input type="number" disabled={mutation.isPending} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="is_required" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Required</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Active</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={mutation.isPending} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
