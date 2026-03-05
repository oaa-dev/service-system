'use client';

import { useMyReferralProgram } from '@/hooks/useReferrals';
import { useMyMerchant } from '@/hooks/useMyMerchant';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, BarChart2, Users } from 'lucide-react';
import { ReferralProgramForm } from './referral-program-form';
import { ReferralStats } from './referral-stats';
import { ReferralsList } from './referrals-list';

export default function ReferralsPage() {
  const { data: program, isLoading } = useMyReferralProgram();
  const { data: merchant } = useMyMerchant();

  const isBranch = !!merchant?.parent_id;
  const programExists = !!program;
  const programActive = program?.is_active ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Referral Program</h1>
          <p className="text-sm text-muted-foreground">
            {isBranch
              ? "View your organization's referral program and track referrals."
              : 'Grow your customer base by rewarding customers who refer their friends.'}
          </p>
        </div>
        {programExists && (
          <Badge variant={programActive ? 'default' : 'secondary'} className="gap-1">
            <UserPlus className="h-3 w-3" />
            {programActive ? 'Active' : 'Inactive'}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && (
        <Tabs defaultValue="program">
          <TabsList>
            <TabsTrigger value="program" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              {isBranch ? 'Program Details' : 'Program Setup'}
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="gap-1.5"
              disabled={!programExists}
              title={!programExists ? 'Create a program first to view stats' : undefined}
            >
              <BarChart2 className="h-4 w-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="gap-1.5"
              disabled={!programExists}
              title={!programExists ? 'Create a program first to view referrals' : undefined}
            >
              <Users className="h-4 w-4" />
              Referrals
              {program?.referrals_count ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {program.referrals_count}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="program" className="mt-6">
            <ReferralProgramForm program={program ?? null} isBranch={isBranch} />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            {programExists && <ReferralStats />}
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            {programExists && <ReferralsList />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
