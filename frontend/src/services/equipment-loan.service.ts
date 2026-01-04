import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface EquipmentUsageLog {
  id: string;
  userId: string;
  loggedAt: string;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  items: EquipmentUsageLogItem[];
}

export interface EquipmentUsageLogItem {
  id: string;
  equipment: {
    id: string;
    name: string;
    category: string;
  };
}

export interface EquipmentHistoryEntry {
  id: string;
  loggedAt: string;
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export const equipmentLoanService = {
  async getHistory(params?: {
    userId?: string;
    equipmentId?: string;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<EquipmentUsageLog[]> {
    const response = await api.get<ApiResponse<EquipmentUsageLog[]>>('/equipment-loans/history', { params });
    return response.data.data!;
  },

  async getEquipmentHistory(equipmentId: string, limit?: number): Promise<EquipmentHistoryEntry[]> {
    const response = await api.get<ApiResponse<EquipmentHistoryEntry[]>>(
      `/equipment-loans/equipment/${equipmentId}/history`,
      { params: { limit } }
    );
    return response.data.data!;
  },

  async getActiveSession(): Promise<unknown> {
    const response = await api.get<ApiResponse<unknown>>('/equipment-loans/session');
    return response.data.data;
  },
};
