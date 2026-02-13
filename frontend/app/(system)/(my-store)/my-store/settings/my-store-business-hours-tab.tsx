'use client';

import { useState, useEffect } from 'react';
import { useUpdateMyBusinessHours } from '@/hooks/useMyMerchant';
import { Merchant } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface BusinessHourEntry {
  day_of_week: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Props { merchant: Merchant; }

export function MyStoreBusinessHoursTab({ merchant }: Props) {
  const updateMutation = useUpdateMyBusinessHours();
  const [hours, setHours] = useState<BusinessHourEntry[]>([]);

  useEffect(() => {
    const existingHours = merchant.business_hours || [];
    const mapped = DAYS.map((_, index) => {
      const existing = existingHours.find((h) => h.day_of_week === index);
      return existing ? {
        day_of_week: index,
        is_closed: existing.is_closed,
        open_time: existing.open_time,
        close_time: existing.close_time,
      } : {
        day_of_week: index,
        is_closed: true,
        open_time: '09:00',
        close_time: '17:00',
      };
    });
    setHours(mapped);
  }, [merchant.business_hours]);

  const handleToggle = (day: number) => {
    setHours((prev) =>
      prev.map((h) => h.day_of_week === day ? { ...h, is_closed: !h.is_closed } : h)
    );
  };

  const handleTimeChange = (day: number, field: 'open_time' | 'close_time', value: string) => {
    setHours((prev) =>
      prev.map((h) => h.day_of_week === day ? { ...h, [field]: value } : h)
    );
  };

  const handleSave = () => {
    updateMutation.mutate({ hours }, {
      onSuccess: () => toast.success('Business hours updated'),
      onError: () => toast.error('Failed to update business hours'),
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Business Hours</CardTitle>
        <CardDescription>Set your store operating hours for each day of the week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hours.map((hour) => (
            <div key={hour.day_of_week} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-3 min-w-[120px]">
                <Switch
                  checked={!hour.is_closed}
                  onCheckedChange={() => handleToggle(hour.day_of_week)}
                />
                <span className="text-sm font-medium">{DAYS[hour.day_of_week]}</span>
              </div>
              {!hour.is_closed ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={hour.open_time}
                    onChange={(e) => handleTimeChange(hour.day_of_week, 'open_time', e.target.value)}
                    className="w-[130px]"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={hour.close_time}
                    onChange={(e) => handleTimeChange(hour.day_of_week, 'close_time', e.target.value)}
                    className="w-[130px]"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Save Business Hours
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
