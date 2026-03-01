import { useQuery, useMutation } from '@tanstack/react-query';
import { conversationService } from '@/services/conversationService';

/**
 * Fetch messages for a conversation tied to a transaction.
 * Falls back to polling (every 5 seconds) since real-time Echo is not yet installed.
 * When laravel-echo + pusher-js are added, set refetchInterval to false and
 * use the Echo subscription in ChatPanel instead.
 *
 * type: 'bookings' | 'reservations' | 'orders'
 * id:   the booking/reservation/order ID
 */
export function useMessages(type: string | undefined, id: number | undefined) {
  return useQuery({
    queryKey: ['conversation', type, id],
    queryFn: () => conversationService.getMessages(type!, id!),
    enabled: !!type && !!id,
    // Poll every 5 seconds as a real-time fallback until Echo is installed.
    refetchInterval: 5000,
  });
}

/**
 * Send a message to the conversation.
 * Does NOT invalidate the query — real-time updates (or polling) handle refresh.
 */
export function useSendMessage() {
  return useMutation({
    mutationFn: ({
      type,
      id,
      body,
    }: {
      type: string;
      id: number;
      body: string;
    }) => conversationService.sendMessage(type, id, body),
  });
}

/**
 * Mark all messages in the conversation as read.
 */
export function useMarkAsRead(type: string | undefined, id: number | undefined) {
  return useMutation({
    mutationFn: () => conversationService.markAsRead(type!, id!),
  });
}
