'use client';

import { useReferralStats } from '@/hooks/useReferrals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';

export function ReferralStats() {
  const { data: stats, isLoading } = useReferralStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const conversionPct = Math.round(stats.conversion_rate * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold tabular-nums">{stats.total_referrals}</p>
            </div>
            <p className="text-xs text-muted-foreground">Total referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold tabular-nums text-emerald-600">
                {stats.completed_referrals}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-2xl font-bold tabular-nums text-amber-600">
                {stats.pending_referrals}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold tabular-nums text-blue-600">{conversionPct}%</p>
            </div>
            <p className="text-xs text-muted-foreground">Conversion rate</p>
          </CardContent>
        </Card>
      </div>

      {stats.top_referrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top referrers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right pr-6">Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.top_referrers.slice(0, 10).map((referrer, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-6 text-muted-foreground text-sm w-8">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {referrer.customer?.name ?? `Customer #${referrer.customer?.id ?? '—'}`}
                    </TableCell>
                    <TableCell className="text-right pr-6 tabular-nums">
                      {referrer.count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
