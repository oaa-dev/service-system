'use client';

import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { isBefore, startOfDay, getDay, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { BookedSlot } from '@/types/api';

interface ScheduleDay {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BookingCalendarProps {
  schedule: ScheduleDay[];
  bookedSlots: Record<string, BookedSlot[]>;
  serviceDuration: number;
  maxCapacity: number;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
}

function generateTimeSlotsForDay(schedule: ScheduleDay, duration: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = schedule.start_time.split(':').map(Number);
  const [endH, endM] = schedule.end_time.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

function getDayAvailability(
  date: Date,
  schedule: ScheduleDay[],
  bookedSlots: Record<string, BookedSlot[]>,
  duration: number,
  maxCapacity: number,
): 'closed' | 'fullyBooked' | 'fewSlots' | 'available' {
  const dayOfWeek = getDay(date);
  const daySchedule = schedule.find((s) => s.day_of_week === dayOfWeek);

  if (!daySchedule || !daySchedule.is_available) return 'closed';

  const dateStr = format(date, 'yyyy-MM-dd');
  const slots = generateTimeSlotsForDay(daySchedule, duration);
  if (slots.length === 0) return 'closed';

  const dayBooked = bookedSlots[dateStr] || [];
  const bookedMap = new Map(dayBooked.map((s) => [s.time, s.booked]));

  let availableCount = 0;
  for (const slot of slots) {
    const booked = bookedMap.get(slot) || 0;
    if (booked < maxCapacity) availableCount++;
  }

  if (availableCount === 0) return 'fullyBooked';
  if (availableCount < slots.length) return 'fewSlots';
  return 'available';
}

export function BookingCalendar({
  schedule,
  bookedSlots,
  serviceDuration,
  maxCapacity,
  selectedDate,
  onDateSelect,
  month,
  onMonthChange,
}: BookingCalendarProps) {
  const today = startOfDay(new Date());

  const { closedDays, fullyBookedDays, fewSlotsDays, availableDays } = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const closed: Date[] = [];
    const fullyBooked: Date[] = [];
    const fewSlots: Date[] = [];
    const available: Date[] = [];

    for (const day of days) {
      if (isBefore(day, today)) continue;
      const status = getDayAvailability(day, schedule, bookedSlots, serviceDuration, maxCapacity);
      switch (status) {
        case 'closed':
          closed.push(day);
          break;
        case 'fullyBooked':
          fullyBooked.push(day);
          break;
        case 'fewSlots':
          fewSlots.push(day);
          break;
        case 'available':
          available.push(day);
          break;
      }
    }

    return { closedDays: closed, fullyBookedDays: fullyBooked, fewSlotsDays: fewSlots, availableDays: available };
  }, [month, schedule, bookedSlots, serviceDuration, maxCapacity, today]);

  const disabledMatcher = (date: Date) => {
    if (isBefore(date, today)) return true;
    const status = getDayAvailability(date, schedule, bookedSlots, serviceDuration, maxCapacity);
    return status === 'closed' || status === 'fullyBooked';
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        month={month}
        onMonthChange={onMonthChange}
        disabled={disabledMatcher}
        modifiers={{
          closed: closedDays,
          fullyBooked: fullyBookedDays,
          fewSlots: fewSlotsDays,
          available: availableDays,
        }}
        modifiersClassNames={{
          closed: 'booking-day-closed',
          fullyBooked: 'booking-day-full',
          fewSlots: 'booking-day-few',
          available: 'booking-day-open',
        }}
        showOutsideDays={false}
        className="w-full"
        classNames={{
          months: 'flex flex-col',
          month: 'space-y-4',
          month_caption: 'flex justify-center pt-1 relative items-center h-10',
          caption_label: 'text-sm font-semibold',
          nav: 'flex items-center absolute inset-x-0 top-0 justify-between px-1',
          button_previous: 'inline-flex items-center justify-center size-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
          button_next: 'inline-flex items-center justify-center size-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
          month_grid: 'w-full border-collapse',
          weekdays: 'flex',
          weekday: 'text-muted-foreground rounded-md w-full font-normal text-[0.8rem] text-center py-1.5',
          week: 'flex w-full mt-1',
          day: 'relative w-full p-0 text-center aspect-square',
          day_button: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors w-full h-full hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
          selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90',
          today: '[&>button]:border [&>button]:border-primary/30',
          outside: 'text-muted-foreground opacity-50',
          disabled: '[&>button]:text-muted-foreground [&>button]:opacity-40',
        }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-amber-500" />
          Few slots
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-red-500" />
          Fully booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-gray-300" />
          Closed
        </span>
      </div>

      {/* CSS for day indicators */}
      <style>{`
        .booking-day-open > button { position: relative; }
        .booking-day-open > button::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: rgb(16 185 129);
        }
        .booking-day-few > button { position: relative; }
        .booking-day-few > button::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: rgb(245 158 11);
        }
        .booking-day-full > button { position: relative; }
        .booking-day-full > button::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: rgb(239 68 68);
        }
        .booking-day-closed > button { position: relative; }
        .booking-day-closed > button::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: rgb(209 213 219);
        }
      `}</style>
    </div>
  );
}
