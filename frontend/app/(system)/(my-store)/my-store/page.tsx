'use client';

import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveDashboard } from './active-dashboard';
import OnboardingDashboard from './onboarding-dashboard';

export default function MyStorePage() {
  const { user } = useAuthStore();
  const merchant = user?.merchant;

  if (!merchant) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (merchant.status === 'active' || merchant.status === 'approved') {
    return <ActiveDashboard />;
  }

  return <OnboardingDashboard />;
}
