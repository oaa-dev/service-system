'use client';

import { useMessagingStore } from '@/stores/messagingStore';
import { useMessagesUnreadCount } from '@/hooks/useMessaging';
import { Badge } from '@/components/ui/badge';

interface MessageBadgeProps {
  className?: string;
}

export function MessageBadge({ className }: MessageBadgeProps) {
  // Fetch unread count on mount
  useMessagesUnreadCount();

  const { unreadCount } = useMessagingStore();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className={className}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}
