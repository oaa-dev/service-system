'use client';

import { Merchant } from '@/types/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Info, Clock, CheckCircle2, XCircle, Ban } from 'lucide-react';

interface MerchantStatusBannerProps {
  merchant: Merchant;
}

export function MerchantStatusBanner({
  merchant,
}: MerchantStatusBannerProps) {
  // Active merchants don't need a banner
  if (merchant.status === 'active') {
    return null;
  }

  // Pending - still onboarding
  if (merchant.status === 'pending') {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">
          Complete Your Profile
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Fill in your business details, upload your logo and documents, then
          submit your application for review.
        </AlertDescription>
        <div className="mt-4">
          <Button asChild variant="default" size="sm">
            <Link href="/my-store/settings">Go to Settings</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  // Submitted - under review
  if (merchant.status === 'submitted') {
    const submittedDate = merchant.submitted_at
      ? new Date(merchant.submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;
    return (
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">
          Application Under Review
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          {submittedDate
            ? `Your application was submitted on ${submittedDate}. An administrator will review it shortly.`
            : 'Your application is under review. An administrator will review it shortly.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Approved
  if (merchant.status === 'approved') {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Application Approved!
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          Your store has been approved and is being activated.
        </AlertDescription>
      </Alert>
    );
  }

  // Rejected
  if (merchant.status === 'rejected') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Application Not Approved</AlertTitle>
        <AlertDescription>
          {merchant.status_reason ||
            'Your application was not approved.'}
        </AlertDescription>
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/my-store/settings">Update Profile</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  // Suspended
  if (merchant.status === 'suspended') {
    return (
      <Alert variant="destructive">
        <Ban className="h-4 w-4" />
        <AlertTitle>Store Suspended</AlertTitle>
        <AlertDescription>
          {merchant.status_reason || 'Your store has been suspended.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Fallback for unknown status
  return null;
}
