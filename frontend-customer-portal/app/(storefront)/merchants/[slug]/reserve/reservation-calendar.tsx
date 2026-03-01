'use client';

import { useMemo, useCallback } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { isBefore, startOfDay, isWithinInterval, parseISO, addDays } from 'date-fns';
import { ReservedDateRange } from '@/types/api';
import { formatPrice } from '@/lib/storefront-utils';

interface ReservationCalendarProps {
  reservedDates: ReservedDateRange[];
  selectedRange: DateRange | undefined;
  onRangeSelect: (range: DateRange | undefined) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
  pricePerNight: number | null;
  nights: number;
}

export function ReservationCalendar({
  reservedDates,
  selectedRange,
  onRangeSelect,
  month,
  onMonthChange,
  pricePerNight,
  nights,
}: ReservationCalendarProps) {
  const today = startOfDay(new Date());

  // Build intervals for reserved date ranges
  const reservedIntervals = useMemo(() => {
    return reservedDates.map((r) => ({
      from: parseISO(r.check_in),
      // check_out day itself is checkout day (available for new check-in)
      to: addDays(parseISO(r.check_out), -1),
    }));
  }, [reservedDates]);

  const isDateReserved = useCallback(
    (date: Date) => {
      return reservedIntervals.some((interval) => {
        if (isBefore(interval.to, interval.from)) return false;
        return isWithinInterval(date, { start: interval.from, end: interval.to });
      });
    },
    [reservedIntervals],
  );

  // Disable past dates and reserved dates
  const disabledMatcher = useCallback(
    (date: Date) => {
      if (isBefore(date, today)) return true;
      return isDateReserved(date);
    },
    [today, isDateReserved],
  );

  // Validate range selection: don't allow ranges that span across reserved blocks
  const handleRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from || !range?.to) {
        onRangeSelect(range);
        return;
      }

      // Check if any reserved date falls within the selected range
      const hasReservedInRange = reservedIntervals.some((interval) => {
        // Check if the reserved interval overlaps with selected range
        return interval.from <= range.to! && interval.to >= range.from!;
      });

      if (hasReservedInRange) {
        // Clear selection if range spans reserved block
        onRangeSelect({ from: range.to, to: undefined });
        return;
      }

      onRangeSelect(range);
    },
    [onRangeSelect, reservedIntervals],
  );

  // Collect reserved dates for modifiers
  const reservedDays = useMemo(() => {
    const days: Date[] = [];
    for (const interval of reservedIntervals) {
      let current = new Date(interval.from);
      while (current <= interval.to) {
        days.push(new Date(current));
        current = addDays(current, 1);
      }
    }
    return days;
  }, [reservedIntervals]);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={handleRangeSelect}
        month={month}
        onMonthChange={onMonthChange}
        disabled={disabledMatcher}
        modifiers={{
          reserved: reservedDays,
        }}
        modifiersClassNames={{
          reserved: 'reservation-day-reserved',
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
          weekday: 'text-muted-foreground rounded-md w-full font-normal text-[0.8rem] py-1.5 text-center',
          week: 'flex w-full mt-1',
          day: 'relative w-full p-0 text-center aspect-square',
          day_button: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors w-full h-full hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
          selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90',
          range_start: 'rounded-l-md [&>button]:rounded-l-md [&>button]:bg-primary [&>button]:text-primary-foreground',
          range_end: 'rounded-r-md [&>button]:rounded-r-md [&>button]:bg-primary [&>button]:text-primary-foreground',
          range_middle: '[&>button]:bg-primary/10 [&>button]:text-primary [&>button]:rounded-none',
          today: '[&>button]:border [&>button]:border-primary/30',
          outside: 'text-muted-foreground opacity-50',
          disabled: '[&>button]:text-muted-foreground [&>button]:opacity-40',
        }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-white border border-border" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-red-500/80" />
          Reserved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm bg-primary/20 border border-primary/30" />
          Selected
        </span>
      </div>

      {/* Price calculation */}
      {nights > 0 && pricePerNight !== null && pricePerNight > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm animate-fade-in">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {formatPrice(pricePerNight)} x {nights} night{nights > 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-primary">
              {formatPrice(pricePerNight * nights)}
            </span>
          </div>
        </div>
      )}

      {/* CSS for reserved day styling */}
      <style>{`
        .reservation-day-reserved > button {
          background-color: rgb(239 68 68 / 0.15) !important;
          color: rgb(185 28 28) !important;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
