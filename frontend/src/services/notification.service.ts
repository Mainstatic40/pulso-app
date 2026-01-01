import api from '../lib/axios';
import type { ApiResponse, Notification } from '../types';

export const notificationService = {
  async getAll(params?: { limit?: number; unreadOnly?: boolean }) {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications', { params });
    return response.data.data!;
  },

  async getUnreadCount() {
    const response = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return response.data.data!;
  },

  async markAsRead(id: string) {
    const response = await api.patch<ApiResponse<{ message: string }>>(`/notifications/${id}/read`);
    return response.data.data!;
  },

  async markAllAsRead() {
    const response = await api.post<ApiResponse<{ message: string }>>('/notifications/read-all');
    return response.data.data!;
  },

  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/notifications/${id}`);
    return response.data.data!;
  },
};
