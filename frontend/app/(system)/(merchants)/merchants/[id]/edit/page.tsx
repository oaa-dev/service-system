/* eslint-disable @next/next/no-img-element */
'use client';

import { use } from 'react';
import { useMerchant } from '@/hooks/useMerchants';
import { MerchantStatus, merchantStatusLabels } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Store, Images, ClipboardList, FolderOpen, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { MerchantDetailsTab } from './merchant-details-tab';
import { MerchantAccountTab } from './merchant-account-tab';
import { MerchantPaymentMethodsTab } from './merchant-payment-methods-tab';
import { MerchantSocialLinksTab } from './merchant-social-links-tab';
import { MerchantDocumentsTab } from './merchant-documents-tab';

const statusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  submitted: 'bg-orange-500 hover:bg-orange-600',
  approved: 'bg-blue-500 hover:bg-blue-600',
  active: 'bg-emerald-500 hover:bg-emerald-600',
  rejected: 'bg-red-500 hover:bg-red-600',
  suspended: 'bg-gray-500 hover:bg-gray-600',
};

export default function MerchantEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const merchantId = parseInt(id);
  const { data, isLoading } = useMerchant(merchantId);
  const merchant = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Merchant not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/merchants"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Merchants</Link>
        </Button>
      </div>
    );
  }

  const isBranch = !!merchant.parent_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/merchants/${merchant.id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {merchant.logo ? (
            <img src={merchant.logo.preview || merchant.logo.thumb} alt={merchant.name} className="h-12 w-12 rounded-lg object-cover border" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Edit: {merchant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[merchant.status]}>{merchantStatusLabels[merchant.status]}</Badge>
              <Badge variant="outline" className="capitalize">{merchant.type}</Badge>
              {isBranch && <Badge variant="secondary"><GitBranch className="mr-1 h-3 w-3" />Branch</Badge>}
            </div>
          </div>
          {!isBranch && (
            <>
              <Button asChild variant="outline">
                <Link href={`/merchants/${merchant.id}/service-categories`}><FolderOpen className="mr-2 h-4 w-4" /> Categories</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/merchants/${merchant.id}/services`}><ClipboardList className="mr-2 h-4 w-4" /> Services</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/merchants/${merchant.id}/gallery`}><Images className="mr-2 h-4 w-4" /> Gallery</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {isBranch ? (
        <MerchantDetailsTab merchant={merchant} isBranch />
      ) : (
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="social-links">Social Links</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <MerchantDetailsTab merchant={merchant} />
          </TabsContent>
          <TabsContent value="payment-methods">
            <MerchantPaymentMethodsTab merchant={merchant} />
          </TabsContent>
          <TabsContent value="social-links">
            <MerchantSocialLinksTab merchant={merchant} />
          </TabsContent>
          <TabsContent value="documents">
            <MerchantDocumentsTab merchant={merchant} />
          </TabsContent>
          <TabsContent value="account">
            <MerchantAccountTab merchant={merchant} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
