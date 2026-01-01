import api from '../lib/axios';
import type { WeeklyLog, ApiResponse } from '../types';

export interface WeeklyLogWithUser extends WeeklyLog {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WeeklyLogSummary {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  totalSessions: number;
  completedTasks: Array<{
    id: string;
    title: string;
    completedAt: string;
  }>;
}

export interface CreateWeeklyLogRequest {
  weekStart: string;
  weekEnd: string;
  activities: string;
  achievements?: string | null;
  challenges?: string | null;
  learnings?: string | null;
  nextGoals?: string | null;
}

export interface UpdateWeeklyLogRequest {
  activities?: string;
  achievements?: string | null;
  challenges?: string | null;
  learnings?: string | null;
  nextGoals?: string | null;
}

export const weeklyLogService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    const response = await api.get<ApiResponse<WeeklyLogWithUser[]>>('/weekly-logs', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<WeeklyLogWithUser>>(`/weekly-logs/${id}`);
    return response.data.data!;
  },

  async getCurrentWeek() {
    const response = await api.get<ApiResponse<WeeklyLogWithUser | null>>('/weekly-logs/current-week');
    return response.data.data;
  },

  async getSummary(userId?: string, weekStart?: string) {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    if (weekStart) params.weekStart = weekStart;
    const response = await api.get<ApiResponse<WeeklyLogSummary>>('/weekly-logs/summary', { params });
    return response.data.data!;
  },

  async create(data: CreateWeeklyLogRequest) {
    try {
      const response = await api.post<ApiResponse<WeeklyLogWithUser>>('/weekly-logs', data);
      return response.data.data!;
    } catch (error: any) {
      console.error('[weeklyLogService.create] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  async update(id: string, data: UpdateWeeklyLogRequest) {
    const response = await api.put<ApiResponse<WeeklyLogWithUser>>(`/weekly-logs/${id}`, data);
    return response.data.data!;
  },
};
