'use client';

import { useRealtimeNotifications } from '@/hooks/useNotifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize real-time notification listener
  useRealtimeNotifications();

  return <>{children}</>;
}
