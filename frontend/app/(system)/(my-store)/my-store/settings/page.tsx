'use client';

import { useMyMerchant } from '@/hooks/useMyMerchant';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store } from 'lucide-react';
import { MyStoreDetailsTab } from './my-store-details-tab';
import { MyStoreBusinessHoursTab } from './my-store-business-hours-tab';
import { MyStorePaymentMethodsTab } from './my-store-payment-methods-tab';
import { MyStoreSocialLinksTab } from './my-store-social-links-tab';
import { MyStoreDocumentsTab } from './my-store-documents-tab';

export default function MyStoreSettingsPage() {
  const { data, isLoading } = useMyMerchant();
  const merchant = data;

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
        <p className="text-lg font-medium text-muted-foreground">Store not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Store</h1>
        <p className="text-muted-foreground">Update your store details and settings</p>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="business-hours">Business Hours</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="social-links">Social Links</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <MyStoreDetailsTab merchant={merchant} />
        </TabsContent>
        <TabsContent value="business-hours">
          <MyStoreBusinessHoursTab merchant={merchant} />
        </TabsContent>
        <TabsContent value="payment-methods">
          <MyStorePaymentMethodsTab merchant={merchant} />
        </TabsContent>
        <TabsContent value="social-links">
          <MyStoreSocialLinksTab merchant={merchant} />
        </TabsContent>
        <TabsContent value="documents">
          <MyStoreDocumentsTab merchant={merchant} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
