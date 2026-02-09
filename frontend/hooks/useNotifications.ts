import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import { getEcho, disconnectEcho, reconnectEcho } from '@/lib/echo';
import { ApiError, Notification, NotificationQueryParams } from '@/types/api';
import { AxiosError } from 'axios';

/**
 * Hook to get paginated list of notifications
 */
export function useNotifications(params?: NotificationQueryParams) {
  const { isAuthenticated } = useAuthStore();
  const { setNotifications } = useNotificationStore();

  const query = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getAll(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });

  useEffect(() => {
    if (query.data?.data) {
      setNotifications(query.data.data);
    }
  }, [query.data, setNotifications]);

  return query;
}

/**
 * Hook to get unread notifications count
 */
export function useUnreadCount() {
  const { isAuthenticated } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();

  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });

  useEffect(() => {
    if (query.data?.data) {
      setUnreadCount(query.data.data.count);
    }
  }, [query.data, setUnreadCount]);

  return query;
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { markAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (_, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Mark as read failed:', error.response?.data?.message);
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotificationStore();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Mark all as read failed:', error.response?.data?.message);
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { removeNotification } = useNotificationStore();

  return useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: (_, id) => {
      removeNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete notification failed:', error.response?.data?.message);
    },
  });
}

/**
 * Hook to listen for real-time notifications via WebSocket
 */
export function useRealtimeNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();

  const handleNewNotification = useCallback(
    (event: { id: string; type: string; data: Notification['data']; read_at: string | null; created_at: string }) => {
      const notification: Notification = {
        id: event.id,
        type: event.type,
        data: event.data,
        read_at: event.read_at,
        created_at: event.created_at,
      };

      addNotification(notification);
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

      // Show toast notification
      toast.info(notification.data.title, {
        description: notification.data.message,
      });
    },
    [addNotification, queryClient]
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      disconnectEcho();
      return;
    }

    // Reconnect echo when user changes to update auth token
    const echo = reconnectEcho();
    if (!echo) {
      return;
    }

    const channelName = `App.Models.User.${user.id}`;

    echo
      .private(channelName)
      .listen('.notification.created', handleNewNotification);

    return () => {
      const currentEcho = getEcho();
      if (currentEcho) {
        currentEcho.leave(channelName);
      }
    };
  }, [isAuthenticated, user?.id, handleNewNotification]);
}
