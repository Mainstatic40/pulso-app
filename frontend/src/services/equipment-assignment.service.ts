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
    today?: boolean;
  }) {
    const response = await api.get<ApiResponse<EquipmentAssignment[]>>('/equipment-assignments', {
      params,
    });

    // Debug log
    console.log('[Frontend] Assignments query:', params);
    console.log('[Frontend] Received:', response.data.data?.length, 'assignments');
    response.data.data?.forEach(a => {
      console.log(`  - ${a.equipment?.name}: ${a.startTime} -> ${a.endTime || 'null'}`);
    });

    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<EquipmentAssignment>>(`/equipment-assignments/${id}`);
    return response.data.data!;
  },

  async create(data: CreateAssignmentRequest) {
    console.log('[EquipmentAssignmentService] Creating assignment with data:', JSON.stringify(data, null, 2));
    console.log('[EquipmentAssignmentService] Data validation:');
    console.log('  - equipmentIds array?', Array.isArray(data.equipmentIds), 'length:', data.equipmentIds?.length);
    console.log('  - userId valid UUID?', /^[0-9a-f-]{36}$/i.test(data.userId || ''));
    console.log('  - startTime valid date?', !isNaN(new Date(data.startTime).getTime()), data.startTime);
    console.log('  - endTime valid date?', data.endTime ? !isNaN(new Date(data.endTime).getTime()) : 'N/A', data.endTime);

    try {
      const response = await api.post<ApiResponse<EquipmentAssignment[]>>(
        '/equipment-assignments',
        data
      );
      console.log('[EquipmentAssignmentService] Assignment created successfully');
      return response.data.data!;
    } catch (error: unknown) {
      console.error('[EquipmentAssignmentService] Error creating assignment:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } };
        console.error('[EquipmentAssignmentService] Response data:', axiosError.response?.data);
        console.error('[EquipmentAssignmentService] Response status:', axiosError.response?.status);
      }
      throw error;
    }
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
