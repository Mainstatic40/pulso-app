import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface MonthlyHoursConfig {
  id: string;
  year: number;
  month: number;
  targetHours: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
  };
}

export interface MonthTargetResponse {
  year: number;
  month: number;
  targetHours: number;
  config: MonthlyHoursConfig | null;
}

export const DEFAULT_TARGET_HOURS = 80;

export const monthlyHoursConfigService = {
  async getAll(year?: number) {
    const params = year ? { year } : {};
    const response = await api.get<ApiResponse<MonthlyHoursConfig[]>>('/monthly-hours-config', { params });
    return response.data.data || [];
  },

  async getByMonth(year: number, month: number) {
    const response = await api.get<ApiResponse<MonthTargetResponse>>(`/monthly-hours-config/${year}/${month}`);
    return response.data.data!;
  },

  async getTargetHours(year: number, month: number): Promise<number> {
    try {
      const response = await api.get<ApiResponse<MonthTargetResponse>>(`/monthly-hours-config/${year}/${month}`);
      return response.data.data?.targetHours || DEFAULT_TARGET_HOURS;
    } catch {
      return DEFAULT_TARGET_HOURS;
    }
  },

  async upsert(year: number, month: number, targetHours: number) {
    const response = await api.put<ApiResponse<MonthlyHoursConfig>>(`/monthly-hours-config/${year}/${month}`, {
      targetHours,
    });
    return response.data.data!;
  },
};
