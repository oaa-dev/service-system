'use client';

import { useEffect } from 'react';
import { useRealtimeMessaging, useMessagesUnreadCount } from '@/hooks/useMessaging';
import { useMessagingStore } from '@/stores/messagingStore';
import { useAuthStore } from '@/stores/authStore';

interface MessagingProviderProps {
  children: React.ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const { isAuthenticated } = useAuthStore();
  const { reset } = useMessagingStore();

  // Setup real-time messaging
  useRealtimeMessaging();

  // Fetch initial unread count
  useMessagesUnreadCount();

  // Reset store on logout
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
    }
  }, [isAuthenticated, reset]);

  return <>{children}</>;
}
