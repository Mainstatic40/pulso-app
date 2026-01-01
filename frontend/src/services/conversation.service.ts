import api from '../lib/axios';
import type { ApiResponse, Conversation, Message } from '../types';

export interface CreateConversationRequest {
  userId?: string;  // For 1:1 conversation
  participantIds?: string[];  // For group conversation
  name?: string;  // For group conversation
  isGroup?: boolean;
}

export const conversationService = {
  async getAll() {
    const response = await api.get<ApiResponse<Conversation[]>>('/conversations');
    return response.data.data!;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<Conversation>>(`/conversations/${id}`);
    return response.data.data!;
  },

  async create(data: CreateConversationRequest) {
    const response = await api.post<ApiResponse<Conversation>>('/conversations', data);
    return response.data.data!;
  },

  async getMessages(conversationId: string, options?: { limit?: number; before?: string }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.before) params.set('before', options.before);

    const url = `/conversations/${conversationId}/messages${params.toString() ? `?${params}` : ''}`;
    const response = await api.get<ApiResponse<Message[]>>(url);
    return response.data.data!;
  },

  async sendMessage(conversationId: string, content: string, attachmentId?: string) {
    const response = await api.post<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, {
      content,
      attachmentId,
    });
    return response.data.data!;
  },

  async markAsRead(conversationId: string) {
    const response = await api.post<ApiResponse<{ message: string }>>(`/conversations/${conversationId}/read`);
    return response.data.data!;
  },

  async getUnreadCount() {
    const response = await api.get<ApiResponse<{ unreadCount: number }>>('/conversations/unread-count');
    return response.data.data!;
  },

  async addParticipant(conversationId: string, userId: string) {
    const response = await api.post<ApiResponse<Conversation>>(`/conversations/${conversationId}/participants`, {
      userId,
    });
    return response.data.data!;
  },

  async removeParticipant(conversationId: string, participantId: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/conversations/${conversationId}/participants/${participantId}`
    );
    return response.data.data!;
  },
};
