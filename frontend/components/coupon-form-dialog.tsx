'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCouponSchema, type CreateCouponFormData } from '@/lib/validations';
import { ApiError, Coupon } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Shuffle } from 'lucide-react';
import { AxiosError } from 'axios';

interface BranchOption {
  id: number;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: Coupon | null;
  onSubmit: (data: CreateCouponFormData) => void;
  isPending: boolean;
  error: AxiosError<ApiError> | null;
  title: string;
  description: string;
  branches?: BranchOption[];
}

const discountTypeOptions = [
  { label: 'Percentage', value: 'percentage' },
  { label: 'Fixed Amount', value: 'fixed' },
  { label: 'Free Product', value: 'free_product' },
] as const;

const dayOptions = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
] as const;

const applicableToOptions = [
  { label: 'Bookings', value: 'booking' },
  { label: 'Reservations', value: 'reservation' },
  { label: 'Product Orders', value: 'sell_product' },
] as const;

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function CouponFormDialog({ open, onOpenChange, coupon, onSubmit, isPending, error, title, description, branches }: Props) {
  const isEdit = !!coupon;

  const form = useForm<CreateCouponFormData>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_amount: null,
      max_uses: null,
      max_uses_per_customer: null,
      reset_period: null,
      applicable_to: null,
      starts_at: new Date().toISOString().slice(0, 16),
      expires_at: null,
      is_active: true,
      is_public: false,
      claim_validity_hours: null,
      valid_schedule: null,
      target_merchant_id: null,
    },
  });

  useEffect(() => {
    if (open && coupon) {
      form.reset({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description ?? '',
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value) || 0,
        min_order_amount: coupon.min_order_amount ? parseFloat(coupon.min_order_amount) : null,
        max_uses: coupon.max_uses,
        max_uses_per_customer: coupon.max_uses_per_customer,
        reset_period: coupon.reset_period ?? null,
        applicable_to: coupon.applicable_to as CreateCouponFormData['applicable_to'],
        starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
        expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : null,
        is_active: coupon.is_active,
        is_public: coupon.is_public,
        claim_validity_hours: coupon.claim_validity_hours,
        valid_schedule: coupon.valid_schedule,
        target_merchant_id: coupon.target_merchant_id ?? null,
      });
    } else if (open && !coupon) {
      form.reset({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: null,
        max_uses: null,
        max_uses_per_customer: null,
        reset_period: null,
        applicable_to: null,
        starts_at: new Date().toISOString().slice(0, 16),
        expires_at: null,
        is_active: true,
        is_public: false,
        claim_validity_hours: null,
        valid_schedule: null,
        target_merchant_id: null,
      });
    }
  }, [open, coupon, form]);

  useEffect(() => {
    if (error) {
      const axiosError = error;
      if (axiosError.response?.data?.errors) {
        Object.entries(axiosError.response.data.errors).forEach(([key, value]) => {
          form.setError(key as keyof CreateCouponFormData, {
            message: Array.isArray(value) ? value[0] : value,
          });
        });
      } else {
        form.setError('root', {
          message: axiosError.response?.data?.message || 'Failed to save coupon',
        });
      }
    }
  }, [error, form]);

  const discountType = form.watch('discount_type');
  const validSchedule = form.watch('valid_schedule');
  const hasScheduleDays = validSchedule?.days && validSchedule.days.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input disabled={isPending} placeholder="Summer Sale 20% Off" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder="SUMMER20"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => field.onChange(generateCode())}
                      disabled={isPending}
                      title="Generate random code"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>Leave empty to auto-generate</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea disabled={isPending} {...field} value={field.value || ''} rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="discount_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {discountTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {discountType !== 'free_product' && (
                  <FormField control={form.control} name="discount_value" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={discountType === 'percentage' ? '1' : '0.01'}
                          min="0"
                          max={discountType === 'percentage' ? '100' : undefined}
                          disabled={isPending}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

              <FormField control={form.control} name="min_order_amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Order Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isPending}
                      placeholder="No minimum"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="max_uses" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Total Uses</FormLabel>
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
                    <FormDescription className="text-xs">Total redemptions across all customers</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="max_uses_per_customer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uses Per Customer</FormLabel>
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
                    <FormDescription className="text-xs">Set to 1 for single-use, or higher for repeat use</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="reset_period" render={({ field }) => (
                <FormItem>
                  <FormLabel>Usage Reset Period</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                    value={field.value ?? 'none'}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Never (lifetime limit)</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    How often the per-customer usage count resets. E.g. &quot;1 use per day&quot; with Daily reset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="starts_at" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="expires_at" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        disabled={isPending}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>Leave empty for no expiry</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="applicable_to" render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable To</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {applicableToOptions.map((opt) => {
                      const checked = field.value?.includes(opt.value) ?? false;
                      return (
                        <label key={opt.value} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(chk) => {
                              const current = field.value ?? [];
                              if (chk) {
                                field.onChange([...current, opt.value]);
                              } else {
                                const next = current.filter((v) => v !== opt.value);
                                field.onChange(next.length > 0 ? next : null);
                              }
                            }}
                            disabled={isPending}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                  <FormDescription>Leave all unchecked to apply to all transaction types</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="valid_schedule" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid Schedule</FormLabel>
                  <FormDescription className="text-xs">
                    Restrict when this coupon can be used. Leave empty for no restriction.
                  </FormDescription>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dayOptions.map((day) => {
                      const days = field.value?.days ?? [];
                      const isSelected = days.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            const currentDays = field.value?.days ?? [];
                            const newDays = isSelected
                              ? currentDays.filter((d) => d !== day.value)
                              : [...currentDays, day.value].sort();
                            if (newDays.length === 0) {
                              field.onChange(null);
                            } else {
                              field.onChange({
                                ...field.value,
                                days: newDays,
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-input hover:bg-accent'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  {hasScheduleDays && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                        <Input
                          type="time"
                          disabled={isPending}
                          value={field.value?.start_time ?? ''}
                          onChange={(e) => {
                            const val = e.target.value || undefined;
                            field.onChange({
                              ...field.value,
                              start_time: val,
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">End Time</label>
                        <Input
                          type="time"
                          disabled={isPending}
                          value={field.value?.end_time ?? ''}
                          onChange={(e) => {
                            const val = e.target.value || undefined;
                            field.onChange({
                              ...field.value,
                              end_time: val,
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              {branches && branches.length > 0 && (
                <FormField control={form.control} name="target_merchant_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Branch</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'all' ? null : parseInt(v))}
                      value={field.value ? String(field.value) : 'all'}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Branches (Organization-wide)</SelectItem>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Choose a specific branch or apply to all branches
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <FormDescription className="text-xs">Coupon can be used by customers</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} disabled={isPending} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="claim_validity_hours" render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Validity (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      disabled={isPending}
                      placeholder="No limit"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    How long a claimed coupon stays valid after being claimed. Leave empty to follow the coupon&apos;s expiry date.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
