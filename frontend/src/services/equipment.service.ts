import api from '../lib/axios';
import type { ApiResponse, Equipment, EquipmentCategory, EquipmentStatus } from '../types';

export interface CreateEquipmentRequest {
  name: string;
  category: EquipmentCategory;
  status?: EquipmentStatus;
  description?: string | null;
  serialNumber?: string | null;
}

export interface UpdateEquipmentRequest {
  name?: string;
  category?: EquipmentCategory;
  status?: EquipmentStatus;
  description?: string | null;
  serialNumber?: string | null;
  isActive?: boolean;
}

export const equipmentService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    category?: EquipmentCategory;
    status?: EquipmentStatus;
    isActive?: boolean;
  }) {
    const response = await api.get<ApiResponse<Equipment[]>>('/equipment', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<Equipment>>(`/equipment/${id}`);
    return response.data.data!;
  },

  async create(data: CreateEquipmentRequest) {
    const response = await api.post<ApiResponse<Equipment>>('/equipment', data);
    return response.data.data!;
  },

  async update(id: string, data: UpdateEquipmentRequest) {
    const response = await api.put<ApiResponse<Equipment>>(`/equipment/${id}`, data);
    return response.data.data!;
  },

  async updateStatus(id: string, status: EquipmentStatus) {
    const response = await api.patch<ApiResponse<Equipment>>(`/equipment/${id}/status`, { status });
    return response.data.data!;
  },

  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/equipment/${id}`);
    return response.data.data!;
  },
};
