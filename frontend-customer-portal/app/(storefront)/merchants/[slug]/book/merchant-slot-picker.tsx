'use client';

import { useBookingSlotAvailability } from '@/hooks/useStorefront';
import { BookingSlotAvailability } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface MerchantSlotPickerProps {
  slug: string;
  serviceId: number | null;
  selectedDate: string | null;
  selectedSlotId: number | null;
  partySize?: number;
  onSlotSelect: (slotId: number, startTime: string, endTime: string | null, maxCapacity: number | null) => void;
}

function formatSlotTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function SlotStatusBadge({ slot }: { slot: BookingSlotAvailability }) {
  if (slot.is_full) {
    return (
      <Badge variant="destructive" className="text-xs px-1.5 py-0">
        Full
      </Badge>
    );
  }

  if (slot.max_capacity !== null && slot.booked > 0) {
    const available = slot.available ?? (slot.max_capacity - slot.booked);
    const ratio = slot.booked / slot.max_capacity;
    if (ratio >= 0.5) {
      return (
        <Badge className="text-xs px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          {available} left
        </Badge>
      );
    }
  }

  return (
    <Badge className="text-xs px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
      Available
    </Badge>
  );
}

function SlotCapacityText({ slot }: { slot: BookingSlotAvailability }) {
  if (slot.max_capacity === null) {
    return <span className="text-xs text-muted-foreground">Unlimited</span>;
  }
  const available = slot.available ?? (slot.max_capacity - slot.booked);
  return (
    <span className="text-xs text-muted-foreground">
      {available} of {slot.max_capacity} available
    </span>
  );
}

export function MerchantSlotPicker({
  slug,
  serviceId,
  selectedDate,
  selectedSlotId,
  partySize = 1,
  onSlotSelect,
}: MerchantSlotPickerProps) {
  const { data, isLoading } = useBookingSlotAvailability(
    selectedDate ? slug : null,
    selectedDate ? serviceId : null,
    selectedDate,
  );

  if (!selectedDate) return null;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  const dayAvailability = data;

  if (!dayAvailability || !dayAvailability.has_slots || dayAvailability.slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No time slots available</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          This merchant hasn&apos;t set up booking time slots for this day.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dayAvailability.slots.map((slot) => {
        const isSelected = selectedSlotId === slot.slot_id;
        const insufficientCapacity = slot.available !== null && slot.available < partySize;
        const isFull = slot.is_full || insufficientCapacity;

        const timeLabel = slot.end_time
          ? `${formatSlotTime(slot.start_time)} – ${formatSlotTime(slot.end_time)}`
          : formatSlotTime(slot.start_time);

        return (
          <button
            key={slot.slot_id}
            type="button"
            disabled={isFull}
            onClick={() => !isFull && onSlotSelect(slot.slot_id, slot.start_time, slot.end_time, slot.max_capacity)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : isFull
                  ? 'border-muted bg-muted/30 opacity-60 cursor-not-allowed'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-primary/[0.03] cursor-pointer',
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-primary' : isFull ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {timeLabel}
              </span>
              <SlotCapacityText slot={slot} />
            </div>
            <SlotStatusBadge slot={slot} />
          </button>
        );
      })}
    </div>
  );
}
