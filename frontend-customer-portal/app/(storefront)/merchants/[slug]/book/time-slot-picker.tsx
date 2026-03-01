'use client';

import { BookedSlot } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleDay {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlotPickerProps {
  date: Date;
  schedule: ScheduleDay[];
  bookedSlots: BookedSlot[];
  serviceDuration: number;
  maxCapacity: number;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

function formatTime(time: string) {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export function TimeSlotPicker({
  date,
  schedule,
  bookedSlots,
  serviceDuration,
  maxCapacity,
  selectedTime,
  onTimeSelect,
}: TimeSlotPickerProps) {
  const dayOfWeek = date.getDay();
  const daySchedule = schedule.find((s) => s.day_of_week === dayOfWeek);

  if (!daySchedule || !daySchedule.is_available) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        This day is closed. Please select another date.
      </div>
    );
  }

  const slots = generateTimeSlots(daySchedule.start_time, daySchedule.end_time, serviceDuration);
  const bookedMap = new Map(bookedSlots.map((s) => [s.time, s.booked]));

  if (slots.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No time slots available for this schedule.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground px-1">
        {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map((slot) => {
          const booked = bookedMap.get(slot) || 0;
          const isFull = booked >= maxCapacity;
          const isSelected = selectedTime === slot;
          const remaining = maxCapacity - booked;

          return (
            <button
              key={slot}
              type="button"
              disabled={isFull}
              onClick={() => onTimeSelect(slot)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-all',
                isFull
                  ? 'cursor-not-allowed border-muted bg-muted/50 opacity-60'
                  : isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-accent/50 cursor-pointer',
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(slot)}
              </span>
              {isFull ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200">
                  Reserved
                </Badge>
              ) : booked > 0 ? (
                <span className="text-[10px] text-amber-600">
                  {remaining} of {maxCapacity} left
                </span>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200">
                  Available
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
