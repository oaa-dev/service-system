'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReservationCalendar } from '@/hooks/useReservations';
import { ReservationCalendarDay } from '@/types/api';

interface Props {
  month: string;
  onMonthChange: (month: string) => void;
  onDayClick: (date: string) => void;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getStatusBadge(day: ReservationCalendarDay): { label: string; className: string } | null {
  if (day.is_closed) return { label: 'CLOSED', className: 'text-muted-foreground' };
  if (day.total_units === 0) return null;
  if (day.available_units === 0) return { label: 'FULL', className: 'text-red-700 dark:text-red-400 font-bold' };
  if (day.available_units < day.total_units) return { label: 'PARTIAL', className: 'text-amber-700 dark:text-amber-400 font-bold' };
  return { label: 'OPEN', className: 'text-emerald-700 dark:text-emerald-400 font-bold' };
}

function getDayColor(day: ReservationCalendarDay): string {
  if (day.is_closed) return 'bg-muted text-muted-foreground cursor-default';
  if (day.total_units === 0) return 'bg-muted/50 text-muted-foreground hover:bg-muted cursor-pointer';
  if (day.available_units === 0) return 'bg-red-100 hover:bg-red-200 text-red-900 cursor-pointer dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-200';
  const ratio = day.available_units / day.total_units;
  if (ratio <= 0.5) return 'bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-200';
  return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 cursor-pointer dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-200';
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

function buildGrid(month: string, days: ReservationCalendarDay[]): (ReservationCalendarDay | null)[] {
  const [year, mon] = month.split('-').map(Number);
  const firstDay = new Date(year, mon - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, mon, 0).getDate();

  const dayMap = new Map<string, ReservationCalendarDay>(days.map((d) => [d.date, d]));
  const grid: (ReservationCalendarDay | null)[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month}-${String(d).padStart(2, '0')}`;
    grid.push(dayMap.get(dateStr) ?? {
      date: dateStr,
      reservation_count: 0,
      total_units: 0,
      available_units: 0,
      is_closed: false,
    });
  }

  return grid;
}

export function ReservationsCalendarView({ month, onMonthChange, onDayClick }: Props) {
  const { data: calendarData, isLoading } = useReservationCalendar(month);

  const grid = calendarData ? buildGrid(month, calendarData) : [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => onMonthChange(navigateMonth(month, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-base">{monthLabel(month)}</span>
        <Button variant="outline" size="icon" onClick={() => onMonthChange(navigateMonth(month, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> Over 50% available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 inline-block" /> 1–50% available</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Fully booked</span>
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
            const badge = getStatusBadge(day);
            return (
              <button
                key={day.date}
                onClick={() => !day.is_closed && onDayClick(day.date)}
                className={`h-16 rounded-md p-1.5 text-left transition-colors border ${getDayColor(day)} ${isToday ? 'ring-2 ring-offset-1 ring-primary' : 'border-transparent'}`}
              >
                <div className={`text-sm font-semibold ${isToday ? 'underline' : ''}`}>
                  {parseInt(day.date.slice(-2), 10)}
                </div>
                {badge && (
                  <div className={`text-[10px] uppercase leading-tight mt-0.5 ${badge.className}`}>
                    {badge.label}
                  </div>
                )}
                {!day.is_closed && day.reservation_count > 0 && (
                  <div className="text-xs leading-tight mt-0.5">
                    {day.reservation_count} res.
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
