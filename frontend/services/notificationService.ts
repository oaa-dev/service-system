import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Notification,
  NotificationQueryParams,
  UnreadCountResponse,
} from '@/types/api';

export const notificationService = {
  /**
   * Get paginated list of notifications
   */
  getAll: async (params?: NotificationQueryParams): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', { params });
    return response.data;
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (): Promise<ApiResponse<UnreadCountResponse>> => {
    const response = await api.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    const response = await api.post<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.post<ApiResponse<{ count: number }>>('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/notifications/${id}`);
    return response.data;
  },
};
