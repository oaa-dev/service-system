'use client';

import { useState } from 'react';
import { useMyLoyaltyProgram } from '@/hooks/useLoyalty';
import { useMyMerchant } from '@/hooks/useMyMerchant';
import type { LoyaltyCard } from '@/types/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, QrCode, CreditCard, AlertCircle } from 'lucide-react';
import { LoyaltyProgramForm } from './loyalty-program-form';
import { QrGenerator } from './qr-generator';
import { LoyaltyCardsList } from './loyalty-cards-list';
import { LoyaltyCardDetailSheet } from './loyalty-card-detail-sheet';

export default function LoyaltyPage() {
  const { data: program, isLoading } = useMyLoyaltyProgram();
  const { data: merchant } = useMyMerchant();
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [activeTab, setActiveTab] = useState('program');

  const isBranch = !!merchant?.parent_id;
  const isOrganization = merchant?.type === 'organization';
  const programExists = !!program;
  const programActive = program?.is_active ?? false;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loyalty Program</h1>
          <p className="text-sm text-muted-foreground">
            {isBranch
              ? 'View your organization\'s loyalty program and manage customer cards.'
              : 'Reward your customers for repeat business with a stamp-based loyalty program.'}
          </p>
        </div>
        {programExists && (
          <Badge variant={programActive ? 'default' : 'secondary'} className="gap-1">
            <Gift className="h-3 w-3" />
            {programActive ? 'Active' : 'Inactive'}
          </Badge>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="program" className="gap-1.5">
              <Gift className="h-4 w-4" />
              {isBranch ? 'Program Details' : 'Program Setup'}
            </TabsTrigger>
            <TabsTrigger
              value="qr"
              className="gap-1.5"
              disabled={!programExists}
              title={!programExists ? 'Create a program first to generate QR codes' : undefined}
            >
              <QrCode className="h-4 w-4" />
              QR Generator
            </TabsTrigger>
            <TabsTrigger
              value="cards"
              className="gap-1.5"
              disabled={!programExists}
              title={!programExists ? 'Create a program first to view customer cards' : undefined}
            >
              <CreditCard className="h-4 w-4" />
              Customer Cards
              {program?.cards_count ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {program.cards_count}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Program Setup tab */}
          <TabsContent value="program" className="mt-6">
            <LoyaltyProgramForm program={program ?? null} isBranch={isBranch} />
          </TabsContent>

          {/* QR Generator tab */}
          <TabsContent value="qr" className="mt-6">
            {!programExists ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No loyalty program configured</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set up a program in the Program Setup tab first.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !programActive ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="rounded-full bg-amber-500/10 p-3">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Program is inactive</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Activate your program in Program Setup to generate QR codes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <QrGenerator />
            )}
          </TabsContent>

          {/* Customer Cards tab */}
          <TabsContent value="cards" className="mt-6">
            {!programExists ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No loyalty program yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customer cards will appear here once a program is configured.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <LoyaltyCardsList
                program_required_stamps={program.required_stamps}
                onSelectCard={(card) => setSelectedCard(card)}
                isOrganization={isOrganization}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Card detail sheet */}
      <LoyaltyCardDetailSheet
        card={selectedCard}
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
