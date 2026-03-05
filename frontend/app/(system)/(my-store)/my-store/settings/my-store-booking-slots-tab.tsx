'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useBookingSlots, useCreateBookingSlot, useUpdateBookingSlot, useDeleteBookingSlot,
} from '@/hooks/useBookingSlots';
import {
  createBookingSlotSchema, type CreateBookingSlotFormData,
} from '@/lib/validations';
import { MerchantBookingSlot } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Pencil, Trash2, Clock, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Display order: Monday first (1-6, then 0 for Sunday)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function formatTime(time: string | null): string {
  if (!time) return '—';
  const [hour, minute] = time.split(':');
  const h = parseInt(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

interface SlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: MerchantBookingSlot;
  onClose: () => void;
}

function SlotFormDialog({ open, onOpenChange, slot, onClose }: SlotFormDialogProps) {
  const isEdit = !!slot;
  const createMutation = useCreateBookingSlot();
  const updateMutation = useUpdateBookingSlot();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CreateBookingSlotFormData>({
    resolver: zodResolver(createBookingSlotSchema),
    defaultValues: {
      day_of_week: slot?.day_of_week ?? 1,
      start_time: slot?.start_time ?? '09:00',
      end_time: slot?.end_time ?? null,
      max_capacity: slot?.max_capacity ?? null,
      is_active: slot?.is_active ?? true,
      sort_order: slot?.sort_order ?? 0,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      onClose();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (data: CreateBookingSlotFormData) => {
    const payload = {
      ...data,
      end_time: data.end_time || null,
      max_capacity: data.max_capacity || null,
    };

    if (isEdit && slot) {
      updateMutation.mutate({ slotId: slot.id, data: payload }, {
        onSuccess: () => {
          toast.success('Booking slot updated');
          handleOpenChange(false);
        },
        onError: () => toast.error('Failed to update booking slot'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Booking slot created');
          handleOpenChange(false);
        },
        onError: () => toast.error('Failed to create booking slot'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Booking Slot' : 'Add Booking Slot'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details for this booking slot.'
              : 'Add a new available booking slot for customers.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">

              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select
                      value={field.value !== undefined ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAY_ORDER.map((dayIndex) => (
                          <SelectItem key={dayIndex} value={String(dayIndex)}>
                            {DAYS[dayIndex]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" disabled={isPending} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Time{' '}
                        <span className="text-muted-foreground text-xs">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          disabled={isPending}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="max_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Max Capacity{' '}
                      <span className="text-muted-foreground text-xs">(leave blank for unlimited)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        disabled={isPending}
                        placeholder="Unlimited"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        disabled={isPending}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Customers can book this slot when active
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {isPending
                  ? (isEdit ? 'Saving...' : 'Adding...')
                  : (isEdit ? 'Save Changes' : 'Add Slot')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function MyStoreBookingSlotsTab() {
  const { data, isLoading } = useBookingSlots();
  const deleteMutation = useDeleteBookingSlot();

  const [createOpen, setCreateOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<MerchantBookingSlot | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<number | null>(null);

  const slots = data ?? [];

  const handleDelete = () => {
    if (deleteSlotId === null) return;
    deleteMutation.mutate(deleteSlotId, {
      onSuccess: () => {
        toast.success('Booking slot deleted');
        setDeleteSlotId(null);
      },
      onError: () => {
        toast.error('Failed to delete booking slot');
        setDeleteSlotId(null);
      },
    });
  };

  // Group slots by day of week in Mon-Sun order, skip days with no slots
  const slotsByDay = DAY_ORDER.map((dayIndex) => ({
    dayIndex,
    dayName: DAYS[dayIndex],
    slots: slots
      .filter((s) => s.day_of_week === dayIndex)
      .sort((a, b) => a.sort_order - b.sort_order || a.start_time.localeCompare(b.start_time)),
  })).filter((group) => group.slots.length > 0);

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Booking Slots</CardTitle>
              <CardDescription>
                Configure available time slots for customer bookings, grouped by day of the week
              </CardDescription>
            </div>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No booking slots configured</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add time slots to let customers book appointments
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {slotsByDay.map(({ dayIndex, dayName, slots: daySlots }) => (
                <div key={dayIndex}>
                  <h4 className="text-sm font-semibold mb-2">{dayName}</h4>
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-lg border px-4 py-3"
                      >
                        <div className="flex items-center gap-4">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{formatTime(slot.start_time)}</span>
                            {slot.end_time && (
                              <>
                                <span className="text-muted-foreground">–</span>
                                <span className="font-medium">{formatTime(slot.end_time)}</span>
                              </>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {slot.max_capacity ? `${slot.max_capacity} capacity` : 'Unlimited'}
                          </span>
                          <Badge variant={slot.is_active ? 'default' : 'secondary'}>
                            {slot.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditSlot(slot)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteSlotId(slot.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <SlotFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit dialog — key forces re-mount with fresh form defaults when slot changes */}
      {editSlot && (
        <SlotFormDialog
          key={editSlot.id}
          open={!!editSlot}
          onOpenChange={(open) => { if (!open) setEditSlot(null); }}
          slot={editSlot}
          onClose={() => setEditSlot(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteSlotId !== null}
        onOpenChange={(open) => { if (!open) setDeleteSlotId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking slot? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
