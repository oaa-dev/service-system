'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loyaltyProgramSchema, type LoyaltyProgramFormData } from '@/lib/validations';
import { useUpsertLoyaltyProgram, useDeactivateLoyaltyProgram } from '@/hooks/useLoyalty';
import type { LoyaltyProgram, ApiError } from '@/types/api';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Info, Plus, Trash2, X } from 'lucide-react';

interface LoyaltyProgramFormProps {
  program: LoyaltyProgram | null;
  isBranch?: boolean;
}

const DEFAULT_TIER = {
  required_stamps: 10,
  reward_type: 'free_product' as const,
  reward_value: '',
  reward_description: '',
};

export function LoyaltyProgramForm({ program, isBranch = false }: LoyaltyProgramFormProps) {
  const upsert = useUpsertLoyaltyProgram();
  const deactivate = useDeactivateLoyaltyProgram();

  const form = useForm<LoyaltyProgramFormData>({
    resolver: zodResolver(loyaltyProgramSchema),
    defaultValues: {
      name: program?.name ?? '',
      description: program?.description ?? '',
      required_stamps: program?.required_stamps ?? 10,
      stamp_expiry_days: program?.stamp_expiry_days ?? null,
      reward_expiry_days: program?.reward_expiry_days ?? null,
      is_active: program?.is_active ?? true,
      tiers: program?.tiers?.map((t) => ({
        required_stamps: t.required_stamps,
        reward_type: t.reward_type,
        reward_value: t.reward_value ?? '',
        reward_description: t.reward_description ?? '',
      })) ?? [DEFAULT_TIER],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tiers',
  });

  // Sync form values when program loads or changes
  useEffect(() => {
    if (program) {
      form.reset({
        name: program.name,
        description: program.description ?? '',
        required_stamps: program.required_stamps,
        stamp_expiry_days: program.stamp_expiry_days ?? null,
        reward_expiry_days: program.reward_expiry_days ?? null,
        is_active: program.is_active,
        tiers: program.tiers?.map((t) => ({
          required_stamps: t.required_stamps,
          reward_type: t.reward_type,
          reward_value: t.reward_value ?? '',
          reward_description: t.reward_description ?? '',
        })) ?? [DEFAULT_TIER],
      });
    }
  }, [program, form]);

  const handleSubmit = async (data: LoyaltyProgramFormData) => {
    try {
      await upsert.mutateAsync({
        name: data.name,
        description: data.description || null,
        required_stamps: data.required_stamps,
        stamp_expiry_days: data.stamp_expiry_days ?? null,
        reward_expiry_days: data.reward_expiry_days ?? null,
        is_active: data.is_active,
        tiers: data.tiers.map((tier) => {
          const showValue =
            tier.reward_type === 'discount_percentage' || tier.reward_type === 'discount_fixed';
          return {
            required_stamps: tier.required_stamps,
            reward_type: tier.reward_type,
            reward_value: showValue ? (tier.reward_value || null) : null,
            reward_description: tier.reward_description || null,
          };
        }),
      });
      toast.success(program ? 'Loyalty program updated' : 'Loyalty program created');
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 422 && error.response.data.errors) {
        const serverErrors = error.response.data.errors;
        for (const [field, messages] of Object.entries(serverErrors)) {
          form.setError(field as keyof LoyaltyProgramFormData, {
            message: messages[0],
          });
        }
      } else {
        toast.error(error.response?.data?.message ?? 'Failed to save loyalty program');
      }
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivate.mutateAsync();
      toast.success('Loyalty program deactivated');
    } catch {
      toast.error('Failed to deactivate loyalty program');
    }
  };

  return (
    <div className="space-y-6">
      {/* Branch info banner */}
      {isBranch && program && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This loyalty program is managed by your organization. You can generate QR codes and manage customer cards, but program settings can only be changed at the organization level.
          </AlertDescription>
        </Alert>
      )}

      {/* Status banner when program exists */}
      {program && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {isBranch ? 'Organization program' : 'Current program'}
            </span>
            <Badge variant={program.is_active ? 'default' : 'secondary'}>
              {program.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {program.cards_count !== undefined && (
              <span className="text-xs text-muted-foreground">
                {program.cards_count} {program.cards_count === 1 ? 'card' : 'cards'}
              </span>
            )}
          </div>
          {!isBranch && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  Deactivate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate loyalty program?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Customers will no longer be able to earn stamps. Existing cards and rewards are
                    preserved. You can reactivate by saving the form with the toggle enabled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivate}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program details</CardTitle>
              <CardDescription>Configure how customers earn stamps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Coffee Rewards" disabled={isBranch} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the program to customers..."
                        rows={3}
                        disabled={isBranch}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="required_stamps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stamps per cycle</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          disabled={isBranch}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Stamps before card resets</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stamp_expiry_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stamp expiry (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="No expiry"
                          disabled={isBranch}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                          }
                        />
                      </FormControl>
                      <FormDescription>Leave blank for no expiry</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reward_expiry_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward expiry (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="No expiry"
                          disabled={isBranch}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                          }
                        />
                      </FormControl>
                      <FormDescription>Leave blank for no expiry</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reward Tiers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Reward tiers</CardTitle>
                  <CardDescription>
                    Define rewards customers earn at different stamp milestones within a cycle.
                  </CardDescription>
                </div>
                {!isBranch && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => append({ ...DEFAULT_TIER })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add tier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.formState.errors.tiers?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.tiers.root.message}
                </p>
              )}

              {fields.map((field, index) => (
                <TierRow
                  key={field.id}
                  index={index}
                  form={form}
                  isBranch={isBranch}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                />
              ))}
            </CardContent>
          </Card>

          {!isBranch && (
            <>
              <Separator />

              {/* Active toggle + save */}
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="cursor-pointer">Program active</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Customers can only earn stamps when active
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={upsert.isPending}>
                  {upsert.isPending ? 'Saving…' : program ? 'Update program' : 'Create program'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}

function TierRow({
  index,
  form,
  isBranch,
  canRemove,
  onRemove,
}: {
  index: number;
  form: ReturnType<typeof useForm<LoyaltyProgramFormData>>;
  isBranch: boolean;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const watchedRewardType = form.watch(`tiers.${index}.reward_type`);
  const showRewardValue =
    watchedRewardType === 'discount_percentage' || watchedRewardType === 'discount_fixed';

  return (
    <div className="relative rounded-lg border p-4">
      {!isBranch && canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`tiers.${index}.required_stamps`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stamps required</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  disabled={isBranch}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`tiers.${index}.reward_type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reward type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={isBranch}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reward type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="free_product">Free product</SelectItem>
                  <SelectItem value="discount_percentage">Percentage discount</SelectItem>
                  <SelectItem value="discount_fixed">Fixed discount</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showRewardValue && (
          <FormField
            control={form.control}
            name={`tiers.${index}.reward_value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {watchedRewardType === 'discount_percentage'
                    ? 'Discount percentage (%)'
                    : 'Discount amount'}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={watchedRewardType === 'discount_percentage' ? 100 : undefined}
                    step="0.01"
                    placeholder={
                      watchedRewardType === 'discount_percentage' ? 'e.g. 20' : 'e.g. 50.00'
                    }
                    disabled={isBranch}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name={`tiers.${index}.reward_description`}
          render={({ field }) => (
            <FormItem className={showRewardValue ? '' : 'sm:col-span-2'}>
              <FormLabel>Reward description</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Get a free medium coffee"
                  disabled={isBranch}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
