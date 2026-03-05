'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { referralProgramSchema, type ReferralProgramFormData } from '@/lib/validations';
import { useCreateOrUpdateReferralProgram, useDeactivateReferralProgram } from '@/hooks/useReferrals';
import type { ReferralProgram, ApiError } from '@/types/api';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Info, Trash2, UserPlus } from 'lucide-react';

interface ReferralProgramFormProps {
  program: ReferralProgram | null;
  isBranch?: boolean;
}

export function ReferralProgramForm({ program, isBranch = false }: ReferralProgramFormProps) {
  const save = useCreateOrUpdateReferralProgram();
  const deactivate = useDeactivateReferralProgram();

  const form = useForm<ReferralProgramFormData>({
    resolver: zodResolver(referralProgramSchema),
    defaultValues: {
      name: program?.name ?? '',
      description: program?.description ?? '',
      referrer_reward_type: program?.referrer_reward_type ?? 'fixed',
      referrer_reward_value: program ? parseFloat(program.referrer_reward_value) : 0,
      referee_reward_type: program?.referee_reward_type ?? 'fixed',
      referee_reward_value: program ? parseFloat(program.referee_reward_value) : 0,
      max_referrals_per_customer: program?.max_referrals_per_customer ?? null,
      code_expiry_days: program?.code_expiry_days ?? 30,
      reward_expiry_days: program?.reward_expiry_days ?? null,
      starts_at: program?.starts_at ?? null,
      ends_at: program?.ends_at ?? null,
    },
  });

  useEffect(() => {
    if (program) {
      form.reset({
        name: program.name,
        description: program.description ?? '',
        referrer_reward_type: program.referrer_reward_type,
        referrer_reward_value: parseFloat(program.referrer_reward_value),
        referee_reward_type: program.referee_reward_type,
        referee_reward_value: parseFloat(program.referee_reward_value),
        max_referrals_per_customer: program.max_referrals_per_customer ?? null,
        code_expiry_days: program.code_expiry_days,
        reward_expiry_days: program.reward_expiry_days ?? null,
        starts_at: program.starts_at ?? null,
        ends_at: program.ends_at ?? null,
      });
    }
  }, [program, form]);

  const handleSubmit = async (data: ReferralProgramFormData) => {
    try {
      await save.mutateAsync({
        name: data.name,
        description: data.description || null,
        referrer_reward_type: data.referrer_reward_type,
        referrer_reward_value: data.referrer_reward_value,
        referee_reward_type: data.referee_reward_type,
        referee_reward_value: data.referee_reward_value,
        max_referrals_per_customer: data.max_referrals_per_customer ?? null,
        code_expiry_days: data.code_expiry_days,
        reward_expiry_days: data.reward_expiry_days ?? null,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      });
      toast.success(program ? 'Referral program updated' : 'Referral program created');
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      if (error.response?.status === 422 && error.response.data.errors) {
        const serverErrors = error.response.data.errors;
        for (const [field, messages] of Object.entries(serverErrors)) {
          form.setError(field as keyof ReferralProgramFormData, {
            message: messages[0],
          });
        }
      } else {
        toast.error(error.response?.data?.message ?? 'Failed to save referral program');
      }
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivate.mutateAsync();
      toast.success('Referral program deactivated');
    } catch {
      toast.error('Failed to deactivate referral program');
    }
  };

  const referrerRewardType = form.watch('referrer_reward_type');
  const refereeRewardType = form.watch('referee_reward_type');

  return (
    <div className="space-y-6">
      {isBranch && program && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This referral program is managed by your organization. Program settings can only be changed at the organization level.
          </AlertDescription>
        </Alert>
      )}

      {program && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {isBranch ? 'Organization program' : 'Current program'}
            </span>
            <Badge variant={program.is_active ? 'default' : 'secondary'}>
              {program.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {program.referrals_count !== undefined && (
              <span className="text-xs text-muted-foreground">
                {program.referrals_count} {program.referrals_count === 1 ? 'referral' : 'referrals'}
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
                  <AlertDialogTitle>Deactivate referral program?</AlertDialogTitle>
                  <AlertDialogDescription>
                    New referral codes will no longer be generated. Existing referrals and rewards are preserved. You can reactivate by saving the program again.
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Program details</CardTitle>
              <CardDescription>
                Basic information about your referral program.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Refer a Friend"
                        disabled={isBranch}
                        {...field}
                      />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referrer reward</CardTitle>
              <CardDescription>
                What the customer who shares their referral code receives.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="referrer_reward_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isBranch}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="percentage">% Discount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referrer_reward_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {referrerRewardType === 'percentage' ? 'Discount (%)' : 'Amount'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={referrerRewardType === 'percentage' ? 100 : undefined}
                          step="0.01"
                          placeholder={referrerRewardType === 'percentage' ? 'e.g. 20' : 'e.g. 100.00'}
                          disabled={isBranch}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referee reward</CardTitle>
              <CardDescription>
                What the new customer receives when they use a referral code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="referee_reward_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isBranch}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="percentage">% Discount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referee_reward_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {refereeRewardType === 'percentage' ? 'Discount (%)' : 'Amount'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={refereeRewardType === 'percentage' ? 100 : undefined}
                          step="0.01"
                          placeholder={refereeRewardType === 'percentage' ? 'e.g. 10' : 'e.g. 50.00'}
                          disabled={isBranch}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Limits &amp; expiry</CardTitle>
              <CardDescription>
                Control how long codes remain valid and how many referrals each customer can make.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="code_expiry_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code expiry (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          disabled={isBranch}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value, 10) : 30)
                          }
                        />
                      </FormControl>
                      <FormDescription>Days before a referral code expires</FormDescription>
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
                          max={365}
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
                  name="max_referrals_per_customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max referrals per customer</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Unlimited"
                          disabled={isBranch}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                          }
                        />
                      </FormControl>
                      <FormDescription>Leave blank for unlimited</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule (optional)</CardTitle>
              <CardDescription>
                Optionally restrict the program to a specific date range.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isBranch}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isBranch}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {!isBranch && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Saving...' : program ? 'Update program' : 'Create program'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
