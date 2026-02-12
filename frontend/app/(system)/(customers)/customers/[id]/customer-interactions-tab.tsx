'use client';

import { useState } from 'react';
import { useCustomerInteractions, useCreateCustomerInteraction, useDeleteCustomerInteraction } from '@/hooks/useCustomers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCustomerInteractionSchema,
  type CreateCustomerInteractionFormData,
} from '@/lib/validations';
import { Customer, CustomerInteractionQueryParams } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { Trash2, Plus } from 'lucide-react';
import { PermissionGate } from '@/components/permission-gate';

const interactionIcons: Record<string, string> = {
  note: 'text-blue-500',
  call: 'text-emerald-500',
  complaint: 'text-red-500',
  inquiry: 'text-amber-500',
};

interface Props { customer: Customer; }

export function CustomerInteractionsTab({ customer }: Props) {
  const [interactionParams] = useState<CustomerInteractionQueryParams>({ per_page: 20 });
  const { data: interactionsData, isLoading: interactionsLoading } = useCustomerInteractions(customer.id, interactionParams);
  const createInteraction = useCreateCustomerInteraction();
  const deleteInteraction = useDeleteCustomerInteraction();
  const [deleteInteractionId, setDeleteInteractionId] = useState<number | null>(null);
  const interactions = interactionsData?.data || [];

  const interactionForm = useForm<CreateCustomerInteractionFormData>({
    resolver: zodResolver(createCustomerInteractionSchema),
    defaultValues: { type: 'note', description: '' },
  });

  const onInteractionSubmit = (formData: CreateCustomerInteractionFormData) => {
    createInteraction.mutate(
      { customerId: customer.id, data: formData },
      { onSuccess: () => interactionForm.reset({ type: 'note', description: '' }) }
    );
  };

  const handleDeleteInteraction = () => {
    if (deleteInteractionId !== null) {
      deleteInteraction.mutate(
        { customerId: customer.id, interactionId: deleteInteractionId },
        { onSuccess: () => setDeleteInteractionId(null) }
      );
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Log Interaction */}
      <PermissionGate permission="customers.update">
        <Card>
          <CardHeader>
            <CardTitle>Log Interaction</CardTitle>
            <CardDescription>Record a new interaction with this customer</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...interactionForm}>
              <form onSubmit={interactionForm.handleSubmit(onInteractionSubmit)} className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <FormField control={interactionForm.control} name="type" render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="complaint">Complaint</SelectItem>
                          <SelectItem value="inquiry">Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="col-span-3">
                    <FormField control={interactionForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormControl><Textarea rows={1} placeholder="Describe the interaction..." disabled={createInteraction.isPending} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={createInteraction.isPending}>
                    {createInteraction.isPending ? <Spinner className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Interaction
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </PermissionGate>

      {/* Interaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Interaction History</CardTitle>
          <CardDescription>{interactions.length} interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {interactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No interactions yet</p>
          ) : (
            <div className="space-y-3">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="group relative rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs capitalize ${interactionIcons[interaction.type]}`}>
                        {interaction.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {interaction.logged_by?.name || 'System'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {interaction.created_at ? formatDate(interaction.created_at) : ''}
                      </span>
                      <PermissionGate permission="customers.update">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteInteractionId(interaction.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                  <p className="text-sm">{interaction.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Interaction Confirm */}
      <AlertDialog open={deleteInteractionId !== null} onOpenChange={(open) => !open && setDeleteInteractionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interaction</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this interaction? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInteraction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteInteraction.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
