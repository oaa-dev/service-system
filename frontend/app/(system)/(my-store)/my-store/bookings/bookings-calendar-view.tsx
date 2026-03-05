'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookingCalendar, useBookings } from '@/hooks/useBookings';
import { BookingCalendarDay, BookingCalendarSlot, BookingStatus } from '@/types/api';

interface Props {
  merchantId: number;
  month: string;
  onMonthChange: (month: string) => void;
  onDayClick: (date: string) => void;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const bookingStatusColors: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  cancelled: 'bg-gray-500',
  completed: 'bg-emerald-500',
  no_show: 'bg-red-500',
};

function getStatusBadge(day: BookingCalendarDay): { label: string; className: string } | null {
  if (day.is_closed) return { label: 'CLOSED', className: 'text-muted-foreground' };
  if (!day.total_capacity) return null;
  const ratio = day.total_booked / day.total_capacity;
  if (ratio >= 0.9) return { label: 'FULL', className: 'text-red-700 dark:text-red-400 font-bold' };
  if (ratio >= 0.5) return { label: 'PARTIAL', className: 'text-amber-700 dark:text-amber-400 font-bold' };
  return { label: 'OPEN', className: 'text-emerald-700 dark:text-emerald-400 font-bold' };
}

function getDayColor(day: BookingCalendarDay): string {
  if (day.is_closed) return 'bg-muted text-muted-foreground cursor-default';
  if (!day.total_capacity) return 'bg-muted/50 text-muted-foreground hover:bg-muted cursor-pointer';
  const ratio = day.total_booked / day.total_capacity;
  if (ratio >= 0.9) return 'bg-red-100 hover:bg-red-200 text-red-900 cursor-pointer dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-200';
  if (ratio >= 0.5) return 'bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-200';
  return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 cursor-pointer dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-200';
}

function getSlotBadge(slot: BookingCalendarSlot): { label: string; className: string } | null {
  if (slot.is_full) return { label: 'FULL', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  if (slot.max_capacity === null) return null;
  const ratio = slot.booked / slot.max_capacity;
  if (ratio >= 0.5) return { label: 'PARTIAL', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
  return { label: 'OPEN', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
}

function navigateMonth(month: string, direction: 1 | -1): string {
  const [year, mon] = month.split('-').map(Number);
  const d = new Date(year, mon - 1 + direction, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function formatDayLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function buildGrid(month: string, days: BookingCalendarDay[]): (BookingCalendarDay | null)[] {
  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, mon, 0).getDate();

  const dayMap = new Map<string, BookingCalendarDay>(days.map((d) => [d.date, d]));
  const grid: (BookingCalendarDay | null)[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month}-${String(d).padStart(2, '0')}`;
    grid.push(dayMap.get(dateStr) ?? {
      date: dateStr,
      booking_count: 0,
      total_booked: 0,
      total_capacity: 0,
      is_closed: false,
    });
  }

  return grid;
}

function SlotBookingsList({ merchantId, date, slotId }: { merchantId: number; date: string; slotId: number }) {
  const { data, isLoading } = useBookings(merchantId, {
    'filter[booking_date]': date,
    'filter[booking_slot_id]': String(slotId),
    per_page: 50,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading bookings...
      </div>
    );
  }

  const bookings = data?.data;

  if (!bookings || bookings.length === 0) {
    return (
      <div className="py-2 px-3 text-xs text-muted-foreground">No bookings for this slot</div>
    );
  }

  return (
    <div className="space-y-1 py-1">
      {bookings.map((booking) => (
        <div key={booking.id} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-muted/50">
          <span className="font-medium truncate flex-1">
            {booking.customer?.name || 'Unknown'}
          </span>
          {booking.party_size > 1 && (
            <span className="text-muted-foreground shrink-0">{booking.party_size} guests</span>
          )}
          <Badge className={`${bookingStatusColors[booking.status]} text-[10px] px-1.5 py-0 shrink-0`}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export function BookingsCalendarView({ merchantId, month, onMonthChange, onDayClick }: Props) {
  const { data: calendarData, isLoading } = useBookingCalendar(month);
  const [selectedDay, setSelectedDay] = useState<BookingCalendarDay | null>(null);
  const [expandedSlotId, setExpandedSlotId] = useState<number | null>(null);

  const grid = calendarData ? buildGrid(month, calendarData) : [];
  const today = new Date().toISOString().slice(0, 10);

  const handleDayClick = (day: BookingCalendarDay) => {
    if (day.is_closed) return;
    setSelectedDay((prev) => (prev?.date === day.date ? null : day));
    setExpandedSlotId(null);
    onDayClick(day.date);
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedDay(null);
    setExpandedSlotId(null);
    onMonthChange(newMonth);
  };

  const toggleSlot = (slotId: number) => {
    setExpandedSlotId((prev) => (prev === slotId ? null : slotId));
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => handleMonthChange(navigateMonth(month, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-base">{monthLabel(month)}</span>
        <Button variant="outline" size="icon" onClick={() => handleMonthChange(navigateMonth(month, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> Under 50% booked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 inline-block" /> 50–89% booked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> 90%+ booked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted inline-block" /> Closed / No data</span>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-xs font-medium text-muted-foreground py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-16 rounded-md" />;
            }
            const isToday = day.date === today;
            const isSelected = selectedDay?.date === day.date;
            const badge = getStatusBadge(day);
            return (
              <button
                key={day.date}
                onClick={() => handleDayClick(day)}
                className={[
                  'h-16 rounded-md p-1.5 text-left transition-colors border',
                  getDayColor(day),
                  isToday ? 'ring-2 ring-offset-1 ring-primary' : '',
                  isSelected && !isToday ? 'ring-2 ring-offset-1 ring-blue-500 border-blue-400' : '',
                  !isSelected && !isToday ? 'border-transparent' : '',
                ].join(' ')}
              >
                <div className={`text-sm font-semibold ${isToday ? 'underline' : ''}`}>
                  {parseInt(day.date.slice(-2), 10)}
                </div>
                {badge && (
                  <div className={`text-[10px] uppercase leading-tight mt-0.5 ${badge.className}`}>
                    {badge.label}
                  </div>
                )}
                {!day.is_closed && day.booking_count > 0 && (
                  <div className="text-xs leading-tight mt-0.5 opacity-80">
                    {day.booking_count} bk.
                  </div>
                )}
                {!day.is_closed && day.booking_count === 0 && !badge && (
                  <div className="text-xs leading-tight mt-0.5 opacity-60">0 bookings</div>
                )}
                {day.is_closed && (
                  <div className="text-xs opacity-60 mt-0.5">Closed</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Slot panel — shown when a day is selected */}
      {selectedDay && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{formatDayLabel(selectedDay.date)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedDay.booking_count} booking{selectedDay.booking_count !== 1 ? 's' : ''}
                {selectedDay.total_capacity
                  ? ` \u00b7 ${selectedDay.total_booked}\u202f/\u202f${selectedDay.total_capacity} capacity`
                  : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 mt-0.5"
              onClick={() => setSelectedDay(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {selectedDay.has_slots && selectedDay.slots && selectedDay.slots.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time Slots</p>
              {selectedDay.slots.map((slot) => {
                const slotBadge = getSlotBadge(slot);
                const capacityLabel = slot.max_capacity === null ? '\u221e' : String(slot.max_capacity);
                const timeLabel = slot.end_time
                  ? `${slot.start_time}\u2013${slot.end_time}`
                  : slot.start_time;
                const isExpanded = expandedSlotId === slot.slot_id;
                return (
                  <div key={slot.slot_id} className="rounded-md border bg-background overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSlot(slot.slot_id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-mono text-xs tabular-nums text-foreground w-24 shrink-0 text-left">
                        {timeLabel}
                      </span>
                      <span className="text-xs text-muted-foreground flex-1 text-left">
                        {slot.max_capacity !== null ? `${slot.max_capacity - slot.booked} of ${slot.max_capacity} available` : `${slot.booked} booked`}
                      </span>
                      {slotBadge && (
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${slotBadge.className}`}>
                          {slotBadge.label}
                        </span>
                      )}
                      {!slotBadge && slot.max_capacity === null && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 bg-muted text-muted-foreground">
                          UNLIMITED
                        </span>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="border-t">
                        <SlotBookingsList
                          merchantId={merchantId}
                          date={selectedDay.date}
                          slotId={slot.slot_id}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border bg-background px-4 py-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="text-muted-foreground">Total bookings</div>
                <div className="font-medium">{selectedDay.booking_count}</div>
                <div className="text-muted-foreground">Slots used</div>
                <div className="font-medium">
                  {selectedDay.total_booked}
                  {selectedDay.total_capacity ? ` / ${selectedDay.total_capacity}` : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
