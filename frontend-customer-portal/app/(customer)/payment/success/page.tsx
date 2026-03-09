'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCheckPaymentStatus } from '@/hooks/useCustomerDashboard';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const checkPayment = useCheckPaymentStatus();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (paymentId && !checked) {
      checkPayment.mutate(Number(paymentId), {
        onSettled: () => setChecked(true),
      });
    } else if (!paymentId) {
      setChecked(true);
    }
  }, [paymentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPaid = checkPayment.data?.data?.status === 'paid';
  const isLoading = !checked || checkPayment.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            Verifying Payment...
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Please wait while we confirm your payment with PayMongo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isPaid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
        {isPaid ? (
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        ) : (
          <AlertCircle className="h-10 w-10 text-amber-600" />
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
          {isPaid ? 'Payment Completed Successfully' : 'Payment Processing'}
        </h1>
        <p className="text-muted-foreground max-w-sm">
          {isPaid
            ? 'Your payment has been confirmed and your booking has been updated.'
            : 'Your payment is still being processed. It may take a few moments to reflect. You can check the status from your booking details.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="rounded-full">
          <Link href="/bookings">View Bookings</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
