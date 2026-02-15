'use client';

import { useAuthStore } from '@/stores/authStore';
import { useMyMerchant, useMyMerchantStatusLogs } from '@/hooks/useMyMerchant';
import { merchantStatusLabels, MerchantStatus } from '@/types/api';
import { MerchantStatusTimeline } from '@/components/merchant-status-timeline';
import { MerchantStatusBanner } from '@/components/merchant-status-banner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { History, ArrowLeft, Store, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const statusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500',
  submitted: 'bg-orange-500',
  approved: 'bg-green-500',
  active: 'bg-emerald-500',
  rejected: 'bg-red-500',
  suspended: 'bg-gray-500',
};

const statusIcons: Record<MerchantStatus, React.ReactNode> = {
  pending: <Clock className="h-5 w-5 text-yellow-500" />,
  submitted: <Clock className="h-5 w-5 text-orange-500" />,
  approved: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  active: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  rejected: <XCircle className="h-5 w-5 text-red-500" />,
  suspended: <AlertTriangle className="h-5 w-5 text-gray-500" />,
};

export default function ApplicationLogPage() {
  const { user } = useAuthStore();
  const merchant = user?.merchant;
  const { data: fullMerchant, isLoading: isMerchantLoading } = useMyMerchant();
  const { data: statusLogs, isLoading: isLoadingLogs } = useMyMerchantStatusLogs();

  const currentMerchant = fullMerchant || merchant;

  if (isMerchantLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/my-store">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Log</h1>
            <p className="text-muted-foreground">Track your merchant application status history</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {currentMerchant && (
        <MerchantStatusBanner merchant={currentMerchant} />
      )}

      {/* Current Status Card */}
      {currentMerchant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Store Name</p>
                <p className="font-medium">{currentMerchant.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  {statusIcons[currentMerchant.status]}
                  <Badge className={statusColors[currentMerchant.status]}>
                    {merchantStatusLabels[currentMerchant.status]}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">
                  {currentMerchant.submitted_at
                    ? format(new Date(currentMerchant.submitted_at), 'MMM d, yyyy h:mm a')
                    : 'Not yet submitted'}
                </p>
              </div>
            </div>
            {currentMerchant.status_reason && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{currentMerchant.status_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Status History
          </CardTitle>
          <CardDescription>
            Complete history of your application status changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MerchantStatusTimeline
            logs={statusLogs || []}
            isLoading={isLoadingLogs}
            showChangedBy={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
