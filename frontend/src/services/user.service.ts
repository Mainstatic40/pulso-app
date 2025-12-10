import api from '../lib/axios';
import type { User, ApiResponse, UserRole } from '../types';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  rfidTag?: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  rfidTag?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const userService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }) {
    console.log('[userService.getAll] Fetching users with params:', params);
    try {
      const response = await api.get<ApiResponse<User[]>>('/users', { params });
      console.log('[userService.getAll] Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[userService.getAll] Error:', error);
      throw error;
    }
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data!;
  },

  async create(data: CreateUserRequest) {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data!;
  },

  async update(id: string, data: UpdateUserRequest) {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data!;
  },

  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/users/${id}`);
    return response.data.data!;
  },

  async getMe() {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data.data!;
  },

  async updateMe(data: { name?: string; email?: string; password?: string }) {
    const response = await api.put<ApiResponse<User>>('/users/me', data);
    return response.data.data!;
  },
};
