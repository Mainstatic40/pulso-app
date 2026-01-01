import api from '../lib/axios';
import type { ApiResponse, TaskStatus, TaskPriority, TaskShift, TaskChecklistItem, Attachment } from '../types';

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string;
  clientRequirements?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  executionDate?: string;
  shift?: TaskShift;
  morningStartTime?: string;
  morningEndTime?: string;
  afternoonStartTime?: string;
  afternoonEndTime?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
  };
  assignees?: Array<{
    assignedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      profileImage?: string | null;
    };
  }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      profileImage?: string | null;
    };
  }>;
  checklistItems?: TaskChecklistItem[];
  attachments?: Attachment[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  clientRequirements?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate: string;
  executionDate?: string | null;
  shift?: TaskShift | null;
  morningStartTime?: string | null;
  morningEndTime?: string | null;
  afternoonStartTime?: string | null;
  afternoonEndTime?: string | null;
  assigneeIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  clientRequirements?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  executionDate?: string | null;
  shift?: TaskShift | null;
  morningStartTime?: string | null;
  morningEndTime?: string | null;
  afternoonStartTime?: string | null;
  afternoonEndTime?: string | null;
  assigneeIds?: string[];
}

export const taskService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    createdBy?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  }) {
    const response = await api.get<ApiResponse<TaskWithRelations[]>>('/tasks', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<TaskWithRelations>>(`/tasks/${id}`);
    return response.data.data!;
  },

  async create(data: CreateTaskRequest) {
    try {
      const response = await api.post<ApiResponse<TaskWithRelations>>('/tasks', data);
      return response.data.data!;
    } catch (error) {
      console.error('[taskService.create] Error:', error);
      throw error;
    }
  },

  async update(id: string, data: UpdateTaskRequest) {
    const response = await api.put<ApiResponse<TaskWithRelations>>(`/tasks/${id}`, data);
    return response.data.data!;
  },

  async updateStatus(id: string, status: TaskStatus) {
    const response = await api.patch<ApiResponse<TaskWithRelations>>(`/tasks/${id}/status`, { status });
    return response.data.data!;
  },

  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/tasks/${id}`);
    return response.data.data!;
  },

  // Checklist methods
  async addChecklistItem(taskId: string, content: string) {
    const response = await api.post<ApiResponse<TaskChecklistItem>>(`/tasks/${taskId}/checklist`, { content });
    return response.data.data!;
  },

  async updateChecklistItem(taskId: string, itemId: string, data: { content?: string; isCompleted?: boolean }) {
    const response = await api.put<ApiResponse<TaskChecklistItem>>(`/tasks/${taskId}/checklist/${itemId}`, data);
    return response.data.data!;
  },

  async deleteChecklistItem(taskId: string, itemId: string) {
    await api.delete(`/tasks/${taskId}/checklist/${itemId}`);
  },

  async reorderChecklistItems(taskId: string, itemIds: string[]) {
    const response = await api.patch<ApiResponse<TaskChecklistItem[]>>(`/tasks/${taskId}/checklist/reorder`, { itemIds });
    return response.data.data!;
  },
};
