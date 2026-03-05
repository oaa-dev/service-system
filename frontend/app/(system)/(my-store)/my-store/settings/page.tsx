'use client';

import { useMyMerchant } from '@/hooks/useMyMerchant';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { StoreSettingsTabs } from './store-settings-tabs';

export default function MyStoreSettingsPage() {
  const { data, isLoading } = useMyMerchant();
  const merchant = data;
  const searchParams = useSearchParams();

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

      <StoreSettingsTabs merchant={merchant} defaultTab={searchParams.get('tab') || 'details'} />
    </div>
  );
}
