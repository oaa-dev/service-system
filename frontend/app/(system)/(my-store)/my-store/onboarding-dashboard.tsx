'use client';

import { useAuthStore } from '@/stores/authStore';
import { useMyMerchant, useMyOnboardingChecklist, useSubmitMyApplication, useMyMerchantStatusLogs } from '@/hooks/useMyMerchant';
import { MerchantStatusBanner } from '@/components/merchant-status-banner';
import { MerchantStatusTimeline } from '@/components/merchant-status-timeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { merchantStatusLabels } from '@/types/api';
import { Store, CheckCircle2, Circle, ArrowRight, SendHorizontal, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';

type ChecklistItemKey =
  | 'account_created'
  | 'email_verified'
  | 'business_type_selected'
  | 'capabilities_configured'
  | 'business_details_completed'
  | 'logo_uploaded'
  | 'documents_uploaded'
  | 'application_submitted'
  | 'admin_approved';

export default function OnboardingDashboard() {
  const { user } = useAuthStore();
  const merchant = user?.merchant;
  const { data: fullMerchant } = useMyMerchant();
  const { data: checklist, isLoading } = useMyOnboardingChecklist();
  const { data: statusLogs, isLoading: isLoadingLogs } = useMyMerchantStatusLogs();
  const submitMutation = useSubmitMyApplication();

  const getActionForItem = (key: ChecklistItemKey) => {
    switch (key) {
      case 'account_created':
      case 'email_verified':
        return null;
      case 'business_type_selected':
      case 'capabilities_configured':
      case 'business_details_completed':
      case 'logo_uploaded':
        return (
          <Link href="/my-store/settings">
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4 mr-1" />
              Complete
            </Button>
          </Link>
        );
      case 'documents_uploaded':
        return (
          <Link href="/my-store/settings?tab=documents">
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </Link>
        );
      case 'admin_approved':
        return (
          <span className="text-sm text-muted-foreground italic">Awaiting review</span>
        );
      default:
        return null;
    }
  };

  const currentStatus = fullMerchant?.status ?? merchant?.status;
  const canSubmitStatuses = ['pending', 'rejected'];
  const canSubmit =
    canSubmitStatuses.includes(currentStatus || '') &&
    checklist?.items
      .filter(
        (item) => item.key !== 'application_submitted' && item.key !== 'admin_approved'
      )
      .every((item) => item.completed);

  const handleSubmit = () => {
    submitMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Application submitted for review!');
      },
      onError: () => {
        toast.error('Failed to submit application');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Store className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            {merchant?.name || 'My Store'}
          </h1>
          {currentStatus && (
            <Badge variant="secondary">{merchantStatusLabels[currentStatus]}</Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Complete the steps below to get your store ready.
        </p>
      </div>

      {/* Status Banner */}
      {(fullMerchant || merchant) && (
        <MerchantStatusBanner merchant={(fullMerchant || merchant)!} />
      )}

      {/* Business Type & Capabilities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Type & Capabilities</CardTitle>
              <CardDescription>Your store configuration</CardDescription>
            </div>
            <Link href="/my-store/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Configure
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Business Type</p>
              <p className="text-sm font-medium">
                {fullMerchant?.business_type?.name || 'Not selected'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Capabilities</p>
              {fullMerchant?.can_sell_products || fullMerchant?.can_take_bookings || fullMerchant?.can_rent_units ? (
                <div className="flex flex-wrap gap-2">
                  {fullMerchant?.can_sell_products && <Badge variant="secondary">Sell Products</Badge>}
                  {fullMerchant?.can_take_bookings && <Badge variant="secondary">Take Bookings</Badge>}
                  {fullMerchant?.can_rent_units && <Badge variant="secondary">Rent Units</Badge>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No capabilities configured</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
          <CardDescription>
            {checklist?.completed_count || 0} of {checklist?.total_count || 0} steps completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={checklist?.completion_percentage || 0} className="h-3" />
            <p className="text-sm text-muted-foreground text-right">
              {checklist?.completion_percentage || 0}% complete
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Card */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started Checklist</CardTitle>
          <CardDescription>Complete these steps to submit your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checklist?.items.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      item.completed ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                {!item.completed && getActionForItem(item.key as ChecklistItemKey)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit button - only show when prerequisites met but not yet submitted */}
      {canSubmit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Ready to submit?</h3>
                <p className="text-sm text-muted-foreground">
                  All prerequisites are complete. Submit your application for admin review.
                </p>
              </div>
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <SendHorizontal className="mr-2 h-4 w-4" />
                Submit for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status History</CardTitle>
          <CardDescription>Track your merchant application progress</CardDescription>
        </CardHeader>
        <CardContent>
          <MerchantStatusTimeline
            logs={statusLogs || []}
            isLoading={isLoadingLogs}
            showChangedBy={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
