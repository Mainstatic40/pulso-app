import api from '../lib/axios';
import type { ApiResponse, EquipmentAssignment } from '../types';

export interface CreateAssignmentRequest {
  equipmentIds: string[];
  userId: string;
  eventId?: string | null;
  startTime: string;
  endTime?: string | null;
  notes?: string | null;
}

export interface UpdateAssignmentRequest {
  userId?: string;
  eventId?: string | null;
  startTime?: string;
  endTime?: string | null;
  notes?: string | null;
}

export const equipmentAssignmentService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    equipmentId?: string;
    userId?: string;
    eventId?: string;
    active?: boolean;
  }) {
    const response = await api.get<ApiResponse<EquipmentAssignment[]>>('/equipment-assignments', {
      params,
    });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<EquipmentAssignment>>(`/equipment-assignments/${id}`);
    return response.data.data!;
  },

  async create(data: CreateAssignmentRequest) {
    const response = await api.post<ApiResponse<EquipmentAssignment[]>>(
      '/equipment-assignments',
      data
    );
    return response.data.data!;
  },

  async update(id: string, data: UpdateAssignmentRequest) {
    const response = await api.put<ApiResponse<EquipmentAssignment>>(
      `/equipment-assignments/${id}`,
      data
    );
    return response.data.data!;
  },

  async returnEquipment(id: string, notes?: string) {
    const response = await api.post<ApiResponse<EquipmentAssignment>>(
      `/equipment-assignments/${id}/return`,
      notes ? { notes } : {}
    );
    return response.data.data!;
  },

  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/equipment-assignments/${id}`
    );
    return response.data.data!;
  },
};
