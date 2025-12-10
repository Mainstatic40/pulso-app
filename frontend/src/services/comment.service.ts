import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface CommentWithUser {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCommentRequest {
  content: string;
}

export const commentService = {
  async getByTaskId(taskId: string) {
    const response = await api.get<ApiResponse<CommentWithUser[]>>(`/tasks/${taskId}/comments`);
    return response.data.data || [];
  },

  async create(taskId: string, data: CreateCommentRequest) {
    const response = await api.post<ApiResponse<CommentWithUser>>(`/tasks/${taskId}/comments`, data);
    return response.data.data!;
  },

  async delete(commentId: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/comments/${commentId}`);
    return response.data.data!;
  },
};
