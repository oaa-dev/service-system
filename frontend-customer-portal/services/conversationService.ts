import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse, Message, Conversation } from '@/types/api';

export interface ConversationMessagesResponse {
  conversation: Conversation;
  messages: PaginatedResponse<Message>;
}

export const conversationService = {
  /**
   * Get or create conversation for the given transaction type and ID,
   * and return the paginated messages list.
   *
   * type: 'bookings' | 'reservations' | 'orders' | 'inquiries'
   * id:   the booking/reservation/order numeric ID, or a merchant slug for inquiries
   */
  getMessages: async (
    type: string,
    id: number | string,
    page = 1,
  ): Promise<ConversationMessagesResponse> => {
    const response = await api.get<ApiResponse<ConversationMessagesResponse>>(
      `/customer/my/conversations/${type}/${id}/messages`,
      { params: { page } },
    );
    return response.data.data;
  },

  /**
   * Send a message in the conversation for the given transaction.
   */
  sendMessage: async (
    type: string,
    id: number | string,
    body: string,
  ): Promise<Message> => {
    const response = await api.post<ApiResponse<Message>>(
      `/customer/my/conversations/${type}/${id}/messages`,
      { body },
    );
    return response.data.data;
  },

  /**
   * Mark all messages in the conversation as read.
   */
  markAsRead: async (type: string, id: number | string): Promise<void> => {
    await api.patch(`/customer/my/conversations/${type}/${id}/read`);
  },
};
