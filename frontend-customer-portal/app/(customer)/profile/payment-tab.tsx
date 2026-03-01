'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock, CreditCard, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/authStore';
import { useMyPaymentMethods, useUpdateMyPaymentPreference } from '@/hooks/useCustomerProfile';

export function PaymentTab() {
  const { user } = useAuthStore();
  const emailVerifiedAt = user?.email_verified_at;

  const { data: paymentMethodsResponse, isLoading } = useMyPaymentMethods();
  const updatePreference = useUpdateMyPaymentPreference();

  const methods = paymentMethodsResponse?.data?.methods ?? [];
  const currentPreferred = paymentMethodsResponse?.data?.preferred ?? null;

  const [selected, setSelected] = useState<string | null>(null);

  // Sync selected with the fetched preferred when it arrives
  const resolvedSelected = selected !== undefined && selected !== null
    ? selected
    : (currentPreferred ?? '');

  const isDirty = resolvedSelected !== (currentPreferred ?? '');

  const handleSave = async () => {
    const valueToSave = resolvedSelected === '' ? null : resolvedSelected;
    try {
      await updatePreference.mutateAsync(valueToSave);
      toast.success('Payment preference saved');
      setSelected(null); // reset local state — will re-sync from server
    } catch {
      toast.error('Failed to save payment preference. Please try again.');
    }
  };

  if (!emailVerifiedAt) {
    return (
      <Card className="shadow-warm border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg font-[family-name:var(--font-display)]">
                Email Verification Required
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Verify your email address to manage your payment preferences and access full platform features.
              </p>
            </div>
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              Unverified Account
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-warm border-0">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-display)] flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Preferred Payment Method
          </CardTitle>
          <CardDescription>
            Choose your preferred way to pay when booking or ordering services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : methods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No payment methods available at this time.</p>
            </div>
          ) : (
            <RadioGroup
              value={resolvedSelected}
              onValueChange={(val) => setSelected(val)}
              className="space-y-2"
            >
              {/* Option to clear preference */}
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  resolvedSelected === ''
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
                onClick={() => setSelected('')}
              >
                <RadioGroupItem value="" id="payment-none" />
                <Label htmlFor="payment-none" className="flex-1 cursor-pointer">
                  <span className="font-medium text-sm">No preference</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose a payment method each time you transact
                  </p>
                </Label>
                {resolvedSelected === '' && (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>

              {methods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    resolvedSelected === method.slug
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => setSelected(method.slug)}
                >
                  <RadioGroupItem value={method.slug} id={`payment-${method.slug}`} />
                  <div className="flex items-center gap-3 flex-1">
                    {method.icon ? (
                      <img
                        src={method.icon.thumb}
                        alt={method.name}
                        className="h-8 w-8 object-contain rounded"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <Label htmlFor={`payment-${method.slug}`} className="cursor-pointer flex-1">
                      <span className="font-medium text-sm">{method.name}</span>
                      {method.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
                      )}
                    </Label>
                  </div>
                  {resolvedSelected === method.slug && (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </RadioGroup>
          )}

          {!isLoading && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={!isDirty || updatePreference.isPending}
              >
                {updatePreference.isPending && <Spinner className="mr-2 h-4 w-4" />}
                Save Preference
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
