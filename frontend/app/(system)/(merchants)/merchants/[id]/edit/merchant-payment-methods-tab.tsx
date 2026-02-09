'use client';

import { useState, useEffect } from 'react';
import { useSyncMerchantPaymentMethods } from '@/hooks/useMerchants';
import { useActivePaymentMethods } from '@/hooks/usePaymentMethods';
import { Merchant } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface Props { merchant: Merchant; }

export function MerchantPaymentMethodsTab({ merchant }: Props) {
  const syncMutation = useSyncMerchantPaymentMethods();
  const { data: paymentMethodsData, isLoading } = useActivePaymentMethods();
  const allMethods = paymentMethodsData?.data || [];

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIds((merchant.payment_methods || []).map((pm) => pm.id));
  }, [merchant.payment_methods]);

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    syncMutation.mutate({ id: merchant.id, data: { payment_method_ids: selectedIds } }, {
      onSuccess: () => toast.success('Payment methods updated'),
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Select which payment methods this merchant accepts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : allMethods.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No payment methods available.</p>
        ) : (
          <div className="space-y-3">
            {allMethods.map((method) => (
              <label key={method.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={selectedIds.includes(method.id)}
                  onCheckedChange={() => handleToggle(method.id)}
                />
                <div>
                  <p className="text-sm font-medium">{method.name}</p>
                  {method.description && <p className="text-xs text-muted-foreground">{method.description}</p>}
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={syncMutation.isPending}>
            {syncMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Save Payment Methods
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
