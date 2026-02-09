import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Conversation,
  Message,
  StartConversationRequest,
  SendMessageRequest,
  ConversationQueryParams,
  MessageQueryParams,
  MessageSearchParams,
  UnreadCountResponse,
} from '@/types/api';

export const messagingService = {
  /**
   * Get paginated list of conversations for current user
   */
  getConversations: async (params?: ConversationQueryParams): Promise<PaginatedResponse<Conversation>> => {
    const response = await api.get<PaginatedResponse<Conversation>>('/conversations', { params });
    return response.data;
  },

  /**
   * Start a new conversation or get existing one
   */
  startConversation: async (data: StartConversationRequest): Promise<ApiResponse<Conversation>> => {
    const response = await api.post<ApiResponse<Conversation>>('/conversations', data);
    return response.data;
  },

  /**
   * Get a single conversation by ID
   */
  getConversation: async (conversationId: number): Promise<ApiResponse<Conversation>> => {
    const response = await api.get<ApiResponse<Conversation>>(`/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Delete a conversation (soft delete for current user)
   */
  deleteConversation: async (conversationId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Get paginated messages for a conversation
   */
  getMessages: async (conversationId: number, params?: MessageQueryParams): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  /**
   * Send a message in a conversation
   */
  sendMessage: async (conversationId: number, data: SendMessageRequest): Promise<ApiResponse<Message>> => {
    const response = await api.post<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, data);
    return response.data;
  },

  /**
   * Mark conversation as read
   */
  markAsRead: async (conversationId: number): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>(`/conversations/${conversationId}/read`);
    return response.data;
  },

  /**
   * Get total unread messages count
   */
  getUnreadCount: async (): Promise<ApiResponse<UnreadCountResponse>> => {
    const response = await api.get<ApiResponse<UnreadCountResponse>>('/messages/unread-count');
    return response.data;
  },

  /**
   * Search messages
   */
  searchMessages: async (params: MessageSearchParams): Promise<PaginatedResponse<Message>> => {
    const response = await api.get<PaginatedResponse<Message>>('/messages/search', { params });
    return response.data;
  },

  /**
   * Delete a message
   */
  deleteMessage: async (messageId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/messages/${messageId}`);
    return response.data;
  },
};
