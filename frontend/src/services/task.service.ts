import api from '../lib/axios';
import type { ApiResponse, TaskStatus, TaskPriority } from '../types';

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string;
  clientRequirements?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  assignees?: Array<{
    assignedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
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
    };
  }>;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  clientRequirements?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate: string;
  assigneeIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  clientRequirements?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
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
    console.log('[taskService.create] Sending data:', JSON.stringify(data, null, 2));
    try {
      const response = await api.post<ApiResponse<TaskWithRelations>>('/tasks', data);
      console.log('[taskService.create] Response:', response.data);
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
};
