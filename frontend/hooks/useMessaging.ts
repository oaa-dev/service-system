import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { messagingService } from '@/services/messagingService';
import { useMessagingStore } from '@/stores/messagingStore';
import { useAuthStore } from '@/stores/authStore';
import { getEcho } from '@/lib/echo';
import { ApiError, Message } from '@/types/api';
import { AxiosError } from 'axios';

/**
 * Hook to get paginated list of conversations
 */
export function useConversations(params?: { per_page?: number; page?: number }) {
  const { isAuthenticated } = useAuthStore();
  const { setConversations } = useMessagingStore();

  const query = useQuery({
    queryKey: ['conversations', params],
    queryFn: () => messagingService.getConversations(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (query.data?.data) {
      setConversations(query.data.data);
    }
  }, [query.data, setConversations]);

  return query;
}

/**
 * Hook to get messages for a conversation with infinite scroll
 */
export function useMessages(conversationId: number | null, params?: { per_page?: number; page?: number }) {
  const { isAuthenticated } = useAuthStore();
  const { setMessages } = useMessagingStore();

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: ({ pageParam = 1 }) =>
      messagingService.getMessages(conversationId!, { ...params, page: pageParam as number }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled: isAuthenticated && conversationId !== null,
    staleTime: 30 * 1000,
    initialPageParam: 1,
  });

  useEffect(() => {
    if (query.data?.pages && conversationId) {
      // Combine all pages and reverse for chronological order (oldest first)
      const allMessages = query.data.pages
        .flatMap((page) => page.data)
        .reverse();
      setMessages(conversationId, allMessages);
    }
  }, [query.data, conversationId, setMessages]);

  return query;
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { addMessage, updateConversation } = useMessagingStore();

  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: number; body: string }) =>
      messagingService.sendMessage(conversationId, body),
    onSuccess: (message, { conversationId }) => {
      addMessage(conversationId, message);
      updateConversation(conversationId, {
        latest_message: message,
        last_message_at: message.created_at,
      });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });
}

/**
 * Hook to mark a conversation as read
 */
export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();
  const { markConversationAsRead } = useMessagingStore();

  return useMutation({
    mutationFn: (conversationId: number) => messagingService.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      markConversationAsRead(conversationId);
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Mark as read failed:', error.response?.data?.message);
    },
  });
}

/**
 * Hook to get total unread messages count
 */
export function useMessagesUnreadCount() {
  const { isAuthenticated } = useAuthStore();
  const { setUnreadCount } = useMessagingStore();

  const query = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => messagingService.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (query.data) {
      setUnreadCount(query.data.count);
    }
  }, [query.data, setUnreadCount]);

  return query;
}

/**
 * Hook to listen for real-time messages on a specific conversation channel
 */
export function useRealtimeMessaging(conversationId: number | null) {
  const {
    addMessage,
    activeConversationId,
    incrementUnreadCount,
  } = useMessagingStore();
  const queryClient = useQueryClient();
  const { mutate: markAsReadMutate } = useMarkConversationAsRead();

  useEffect(() => {
    if (!conversationId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`conversation.${conversationId}`);

    channel.listen('.ChatMessageSent', (message: Message) => {
      addMessage(conversationId, message);

      // If this conversation is active, mark as read automatically
      if (activeConversationId === conversationId) {
        markAsReadMutate(conversationId);
      } else {
        const senderName = message.sender?.name;
        toast.info(senderName ? `New message from ${senderName}` : 'New message', {
          description: message.body.length > 50 ? message.body.substring(0, 50) + '...' : message.body,
        });
        incrementUnreadCount();
      }

      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      echo.leave(`conversation.${conversationId}`);
    };
  }, [conversationId, addMessage, activeConversationId, incrementUnreadCount, queryClient, markAsReadMutate]);
}
