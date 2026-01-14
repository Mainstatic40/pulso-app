import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface MonthlyHoursConfig {
  id: string | null;
  year: number;
  month: number;
  targetHours: number;
  hoursPerDay: number;
  startDate: string | null;
  totalWorkdays: number;
  workdaysElapsed: number;
  calculatedTarget: number;
  isCustomTarget: boolean;
  creator?: {
    id: string;
    name: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const DEFAULT_HOURS_PER_DAY = 4;

export const monthlyHoursConfigService = {
  async getAll(year?: number) {
    const params = year ? { year } : {};
    const response = await api.get<ApiResponse<MonthlyHoursConfig[]>>('/monthly-hours-config', { params });
    return response.data.data || [];
  },

  async getByMonth(year: number, month: number): Promise<MonthlyHoursConfig> {
    const response = await api.get<ApiResponse<MonthlyHoursConfig>>(`/monthly-hours-config/${year}/${month}`);
    return response.data.data!;
  },

  async upsert(
    year: number,
    month: number,
    targetHours: number,
    hoursPerDay: number = DEFAULT_HOURS_PER_DAY,
    startDate: string | null = null
  ) {
    const response = await api.put<ApiResponse<MonthlyHoursConfig>>(`/monthly-hours-config/${year}/${month}`, {
      targetHours,
      hoursPerDay,
      startDate,
    });
    return response.data.data!;
  },
};
