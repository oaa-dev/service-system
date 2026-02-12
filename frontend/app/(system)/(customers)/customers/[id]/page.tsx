'use client';

import { use } from 'react';
import { useCustomer } from '@/hooks/useCustomers';
import { CustomerStatus } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { CustomerDetailsTab } from './customer-details-tab';
import { CustomerInteractionsTab } from './customer-interactions-tab';
import { CustomerAccountTab } from './customer-account-tab';
import { CustomerDocumentsTab } from './customer-documents-tab';

const statusColors: Record<CustomerStatus, string> = {
  active: 'bg-emerald-500',
  suspended: 'bg-yellow-500',
  banned: 'bg-red-500',
};

const tierColors: Record<string, string> = {
  regular: 'bg-gray-500',
  silver: 'bg-slate-400',
  gold: 'bg-amber-500',
  platinum: 'bg-violet-500',
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const customerId = parseInt(id);
  const { data, isLoading } = useCustomer(customerId);
  const customer = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Customer not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/customers"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{customer.user?.name || 'Customer'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={statusColors[customer.status]}>{customer.status}</Badge>
            <Badge className={tierColors[customer.customer_tier]}>{customer.customer_tier}</Badge>
            <Badge variant="outline" className="capitalize">{customer.customer_type}</Badge>
            {customer.company_name && (
              <span className="text-sm text-muted-foreground">{customer.company_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <CustomerDetailsTab customer={customer} />
        </TabsContent>
        <TabsContent value="documents">
          <CustomerDocumentsTab customer={customer} />
        </TabsContent>
        <TabsContent value="interactions">
          <CustomerInteractionsTab customer={customer} />
        </TabsContent>
        <TabsContent value="account">
          <CustomerAccountTab customer={customer} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
