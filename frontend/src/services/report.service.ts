import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export interface HoursByUserData {
  userId: string;
  userName: string;
  totalHours: number;
  totalSessions: number;
}

export interface HoursByEventData {
  eventId: string;
  eventName: string;
  totalHours: number;
  assigneesCount: number;
}

export interface TasksSummaryData {
  pending: number;
  inProgress: number;
  review: number;
  completed: number;
  total: number;
  completionRate: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ProductivityData {
  userId: string;
  userName: string;
  hoursWorked: number;
  tasksCompleted: number;
  tasksInProgress: number;
  avgHoursPerTask: number;
}

export const reportService = {
  async getHoursByUser(filters: ReportFilters) {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.userId) params.userId = filters.userId;

    const response = await api.get<ApiResponse<HoursByUserData[]>>('/reports/hours-by-user', { params });
    return response.data.data || [];
  },

  async getHoursByEvent(filters: ReportFilters) {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;

    const response = await api.get<ApiResponse<HoursByEventData[]>>('/reports/hours-by-event', { params });
    return response.data.data || [];
  },

  async getTasksSummary(filters: ReportFilters) {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.userId) params.userId = filters.userId;

    const response = await api.get<ApiResponse<TasksSummaryData>>('/reports/tasks-summary', { params });
    return response.data.data!;
  },

  async getProductivity(filters: ReportFilters) {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;

    const response = await api.get<ApiResponse<ProductivityData[]>>('/reports/productivity', { params });
    return response.data.data || [];
  },

  async exportToExcel(type: 'hours' | 'tasks' | 'productivity', filters: ReportFilters) {
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.userId) params.userId = filters.userId;

    const response = await api.get(`/reports/export/${type}`, {
      params,
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get filename from content-disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `reporte-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
