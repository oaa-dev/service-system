'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfoTab } from './personal-info-tab';
import { AccountTab } from './account-tab';
import { PaymentTab } from './payment-tab';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>

      <Tabs defaultValue="personal-info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info">
          <PersonalInfoTab />
        </TabsContent>

        <TabsContent value="account">
          <AccountTab />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
