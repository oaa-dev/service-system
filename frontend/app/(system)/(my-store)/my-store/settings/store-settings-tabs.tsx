'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Merchant } from '@/types/api';
import { MyStoreDetailsTab } from './my-store-details-tab';
import { MyStoreBusinessHoursTab } from './my-store-business-hours-tab';
import { MyStorePaymentMethodsTab } from './my-store-payment-methods-tab';
import { MyStoreSocialLinksTab } from './my-store-social-links-tab';
import { MyStoreDocumentsTab } from './my-store-documents-tab';
import { MyStoreBookingSlotsTab } from './my-store-booking-slots-tab';

interface StoreSettingsTabsProps {
  merchant: Merchant;
  branchId?: number;
  defaultTab?: string;
}

export function StoreSettingsTabs({ merchant, branchId, defaultTab = 'details' }: StoreSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="business-hours">Business Hours</TabsTrigger>
        <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        <TabsTrigger value="social-links">Social Links</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        {merchant.can_take_bookings && (
          <TabsTrigger value="booking-slots">Booking Slots</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="details">
        <MyStoreDetailsTab merchant={merchant} branchId={branchId} />
      </TabsContent>
      <TabsContent value="business-hours">
        <MyStoreBusinessHoursTab merchant={merchant} branchId={branchId} />
      </TabsContent>
      <TabsContent value="payment-methods">
        <MyStorePaymentMethodsTab merchant={merchant} branchId={branchId} />
      </TabsContent>
      <TabsContent value="social-links">
        <MyStoreSocialLinksTab merchant={merchant} branchId={branchId} />
      </TabsContent>
      <TabsContent value="documents">
        <MyStoreDocumentsTab merchant={merchant} branchId={branchId} />
      </TabsContent>
      {merchant.can_take_bookings && (
        <TabsContent value="booking-slots">
          <MyStoreBookingSlotsTab />
        </TabsContent>
      )}
    </Tabs>
  );
}
