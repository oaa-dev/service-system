'use client';

import { useState } from 'react';
import { useMerchantReferrals } from '@/hooks/useReferrals';
import type { ReferralStatus } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_VARIANTS: Record<ReferralStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  completed: 'default',
  expired: 'secondary',
  cancelled: 'destructive',
};

const STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export function ReferralsList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'all'>('all');

  const { data, isLoading } = useMerchantReferrals({
    page,
    per_page: 15,
    sort: '-created_at',
    ...(statusFilter !== 'all' ? { 'filter[status]': statusFilter } : {}),
  });

  const referrals = data?.data ?? [];
  const pagination = data?.meta;

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as ReferralStatus | 'all');
    setPage(1);
  };

  const getCustomerName = (customer?: { id: number; user?: { id: number; name: string; email: string } }) => {
    if (!customer) return '—';
    return customer.user?.name ?? `Customer #${customer.id}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Referee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : referrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                    <Users className="h-8 w-8 opacity-40" />
                    <p>
                      {statusFilter !== 'all'
                        ? 'No referrals match the selected status.'
                        : 'No referrals yet.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="font-medium">
                    {getCustomerName(referral.referrer_customer)}
                  </TableCell>
                  <TableCell>
                    {getCustomerName(referral.referee_customer)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[referral.status]}>
                      {STATUS_LABELS[referral.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {referral.completed_at
                      ? format(new Date(referral.completed_at), 'MMM d, yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(referral.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? 'referral' : 'referrals'}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= pagination.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
