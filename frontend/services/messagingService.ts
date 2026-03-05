import api from '@/lib/axios';
import {
  PaginatedResponse,
  Conversation,
  Message,
} from '@/types/api';

export const messagingService = {
  /**
   * Get paginated list of conversations for current user
   */
  getConversations: async (params?: { per_page?: number; page?: number }): Promise<PaginatedResponse<Conversation>> => {
    const response = await api.get<PaginatedResponse<Conversation>>('/conversations', { params });
    return response.data;
  },

  /**
   * Get paginated messages for a conversation
   */
  getMessages: async (conversationId: number, params?: { per_page?: number; page?: number }): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  /**
   * Send a message in a conversation
   */
  sendMessage: async (conversationId: number, body: string): Promise<Message> => {
    const response = await api.post<{ data: Message }>(`/conversations/${conversationId}/messages`, { body });
    return response.data.data;
  },

  /**
   * Mark conversation as read
   */
  markAsRead: async (conversationId: number): Promise<void> => {
    await api.post(`/conversations/${conversationId}/read`);
  },

  /**
   * Get total unread messages count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<{ data: { count: number } }>('/messages/unread-count');
    return response.data.data;
  },
};
