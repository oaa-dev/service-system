'use client';

import { MerchantStatusLog, merchantStatusLabels, MerchantStatus } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MerchantStatusTimelineProps {
  logs: MerchantStatusLog[];
  isLoading?: boolean;
  showChangedBy?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  submitted: 'bg-orange-500',
  approved: 'bg-green-500',
  active: 'bg-emerald-500',
  rejected: 'bg-red-500',
  suspended: 'bg-red-400',
};

const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'active':
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
    case 'suspended':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function MerchantStatusTimeline({
  logs,
  isLoading = false,
  showChangedBy = false,
}: MerchantStatusTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="h-3 w-3 rounded-full" />
              {i < 2 && <div className="flex-1 w-px bg-border mt-2" />}
            </div>
            <div className="pb-6 flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No status history available
      </div>
    );
  }

  return (
    <div>
      {logs.map((log, index) => (
        <div key={log.id} className="flex gap-4">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div
              className={`h-3 w-3 rounded-full ${
                statusColors[log.to_status] || 'bg-gray-500'
              }`}
            />
            {index < logs.length - 1 && (
              <div className="flex-1 w-px bg-border mt-2" />
            )}
          </div>

          {/* Content */}
          <div className="pb-6 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {log.from_status && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {merchantStatusLabels[log.from_status as MerchantStatus] || log.from_status}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </>
              )}
              <Badge variant={statusBadgeVariant(log.to_status)}>
                {merchantStatusLabels[log.to_status as MerchantStatus] || log.to_status}
              </Badge>
            </div>
            {log.reason && (
              <p className="text-sm text-muted-foreground mt-1">{log.reason}</p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(log.created_at), {
                  addSuffix: true,
                })}
              </span>
              {showChangedBy && log.changed_by && (
                <span>• by {log.changed_by.name}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
