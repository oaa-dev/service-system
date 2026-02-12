'use client';

import { useEffect, useState } from 'react';
import { useServiceSchedules, useUpdateServiceSchedules } from '@/hooks/useMerchants';
import { Service } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ScheduleRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DEFAULT_SCHEDULES: ScheduleRow[] = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '17:00',
  is_available: i >= 1 && i <= 5, // Mon-Fri available by default
}));

interface Props {
  merchantId: number;
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceScheduleDialog({ merchantId, service, open, onOpenChange }: Props) {
  const { data: schedulesData, isLoading } = useServiceSchedules(
    merchantId,
    service?.id ?? 0,
  );
  const mutation = useUpdateServiceSchedules();

  const [schedules, setSchedules] = useState<ScheduleRow[]>(DEFAULT_SCHEDULES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && schedulesData?.data && schedulesData.data.length > 0) {
      // Merge existing schedules into the 7-day template
      const merged = DEFAULT_SCHEDULES.map((def) => {
        const existing = schedulesData.data.find((s) => s.day_of_week === def.day_of_week);
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            start_time: existing.start_time.substring(0, 5), // "09:00:00" -> "09:00"
            end_time: existing.end_time.substring(0, 5),
            is_available: existing.is_available,
          };
        }
        return def;
      });
      setSchedules(merged);
    } else if (open) {
      setSchedules(DEFAULT_SCHEDULES);
    }
  }, [open, schedulesData]);

  const updateRow = (dayIndex: number, field: keyof ScheduleRow, value: string | boolean) => {
    setSchedules((prev) =>
      prev.map((row) =>
        row.day_of_week === dayIndex ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = () => {
    if (!service) return;
    setError(null);

    mutation.mutate(
      { merchantId, serviceId: service.id, data: { schedules } },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => {
          const axiosError = err as AxiosError<ApiError>;
          setError(axiosError.response?.data?.message || 'Failed to update schedules');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule — {service?.name}</DialogTitle>
          <DialogDescription>
            Set weekly availability{service?.duration ? ` (${service.duration} min sessions)` : ''}.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {schedules.map((row) => (
              <div key={row.day_of_week} className="flex items-center gap-3">
                <Label className="w-20 text-sm font-medium shrink-0">
                  {DAY_NAMES[row.day_of_week].substring(0, 3)}
                </Label>
                <Input
                  type="time"
                  value={row.start_time}
                  onChange={(e) => updateRow(row.day_of_week, 'start_time', e.target.value)}
                  disabled={!row.is_available || mutation.isPending}
                  className="w-28"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={row.end_time}
                  onChange={(e) => updateRow(row.day_of_week, 'end_time', e.target.value)}
                  disabled={!row.is_available || mutation.isPending}
                  className="w-28"
                />
                <div className="flex items-center gap-2 ml-auto">
                  <Switch
                    checked={row.is_available}
                    onCheckedChange={(v) => updateRow(row.day_of_week, 'is_available', v)}
                    disabled={mutation.isPending}
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {row.is_available ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending || isLoading}>
            {mutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
