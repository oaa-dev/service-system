import { useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { messagingService } from '@/services/messagingService';
import { useMessagingStore } from '@/stores/messagingStore';
import { useAuthStore } from '@/stores/authStore';
import { getEcho } from '@/lib/echo';
import {
  ApiError,
  Message,
  ConversationQueryParams,
  MessageQueryParams,
  MessageSearchParams,
  StartConversationRequest,
  SendMessageRequest,
  MessageSentEvent,
  ConversationUpdatedEvent,
} from '@/types/api';
import { AxiosError } from 'axios';

/**
 * Hook to get paginated list of conversations
 */
export function useConversations(params?: ConversationQueryParams) {
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
 * Hook to get a single conversation
 */
export function useConversation(conversationId: number | null) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: () => messagingService.getConversation(conversationId!),
    enabled: isAuthenticated && conversationId !== null,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to start a new conversation
 */
export function useStartConversation() {
  const queryClient = useQueryClient();
  const { addConversation, setActiveConversation } = useMessagingStore();

  return useMutation({
    mutationFn: (data: StartConversationRequest) => messagingService.startConversation(data),
    onSuccess: (response) => {
      addConversation(response.data);
      setActiveConversation(response.data.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to start conversation');
    },
  });
}

/**
 * Hook to delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { removeConversation } = useMessagingStore();

  return useMutation({
    mutationFn: (conversationId: number) => messagingService.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      removeConversation(conversationId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete conversation');
    },
  });
}

/**
 * Hook to get messages for a conversation with infinite scroll
 */
export function useMessages(conversationId: number | null, params?: MessageQueryParams) {
  const { isAuthenticated } = useAuthStore();
  const { setMessages } = useMessagingStore();

  const query = useInfiniteQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: ({ pageParam = 1 }) =>
      messagingService.getMessages(conversationId!, { ...params, page: pageParam }),
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
    mutationFn: ({ conversationId, data }: { conversationId: number; data: SendMessageRequest }) =>
      messagingService.sendMessage(conversationId, data),
    onSuccess: (response, { conversationId }) => {
      addMessage(conversationId, response.data);
      // Update conversation's latest message
      updateConversation(conversationId, {
        latest_message: response.data,
        last_message_at: response.data.created_at,
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
  });

  useEffect(() => {
    if (query.data?.data) {
      setUnreadCount(query.data.data.count);
    }
  }, [query.data, setUnreadCount]);

  return query;
}

/**
 * Hook to search messages
 */
export function useSearchMessages(params: MessageSearchParams | null) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['messages', 'search', params],
    queryFn: () => messagingService.searchMessages(params!),
    enabled: isAuthenticated && params !== null && params.q.length >= 2,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { removeMessage } = useMessagingStore();

  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: number; messageId: number }) =>
      messagingService.deleteMessage(messageId).then(() => ({ conversationId, messageId })),
    onSuccess: ({ conversationId, messageId }) => {
      removeMessage(conversationId, messageId);
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast.success('Message deleted');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    },
  });
}

/**
 * Hook to listen for real-time messages via WebSocket
 */
export function useRealtimeMessaging() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    addMessage,
    updateConversation,
    activeConversationId,
    incrementUnreadCount,
  } = useMessagingStore();
  const queryClient = useQueryClient();
  const markAsRead = useMarkConversationAsRead();

  const handleMessageSent = useCallback(
    (event: MessageSentEvent) => {
      const message: Message = {
        id: event.id,
        conversation_id: event.conversation_id,
        sender_id: event.sender_id,
        sender: event.sender,
        body: event.body,
        read_at: event.read_at,
        is_mine: false,
        created_at: event.created_at,
        updated_at: event.created_at,
      };

      addMessage(event.conversation_id, message);

      // If conversation is active, mark as read automatically
      if (activeConversationId === event.conversation_id) {
        markAsRead.mutate(event.conversation_id);
      } else {
        // Show toast notification for new message
        toast.info(`New message from ${event.sender.name}`, {
          description: event.body.length > 50 ? event.body.substring(0, 50) + '...' : event.body,
        });
        incrementUnreadCount();
      }

      queryClient.invalidateQueries({ queryKey: ['messages', event.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
    [addMessage, activeConversationId, markAsRead, incrementUnreadCount, queryClient]
  );

  const handleConversationUpdated = useCallback(
    (event: ConversationUpdatedEvent) => {
      updateConversation(event.id, {
        last_message_at: event.last_message_at,
        latest_message: event.latest_message
          ? {
              id: event.latest_message.id,
              conversation_id: event.id,
              sender_id: event.latest_message.sender_id,
              body: event.latest_message.body,
              read_at: null,
              is_mine: event.latest_message.sender_id === user?.id,
              created_at: event.latest_message.created_at,
              updated_at: event.latest_message.created_at,
            }
          : null,
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    [updateConversation, user?.id, queryClient]
  );

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const echo = getEcho();
    if (!echo) {
      return;
    }

    const channelName = `App.Models.User.${user.id}`;

    echo
      .private(channelName)
      .listen('.message.sent', handleMessageSent)
      .listen('.conversation.updated', handleConversationUpdated);

    return () => {
      const currentEcho = getEcho();
      if (currentEcho) {
        currentEcho.private(channelName).stopListening('.message.sent');
        currentEcho.private(channelName).stopListening('.conversation.updated');
      }
    };
  }, [isAuthenticated, user?.id, handleMessageSent, handleConversationUpdated]);
}
