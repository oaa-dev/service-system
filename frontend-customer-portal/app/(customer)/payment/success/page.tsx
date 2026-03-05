'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
          Payment Completed Successfully
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Your payment has been processed. You can close this page and return to the app.
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
