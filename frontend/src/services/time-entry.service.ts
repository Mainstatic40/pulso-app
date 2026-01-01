import api from '../lib/axios';
import type { TimeEntry, ApiResponse } from '../types';

export interface TimeEntryWithEvent extends TimeEntry {
  event?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TimeEntrySummary {
  period: string;
  dateFrom: string;
  dateTo: string;
  totalHours: number;
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  entries: TimeEntryWithEvent[];
}

export interface ClockInRequest {
  eventId?: string | null;
}

export interface RfidRequest {
  rfidTag: string;
  eventId?: string | null;
}

export interface RfidResponse {
  action: 'clock_in' | 'clock_out';
  entry: TimeEntry;
  totalHours: number | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const timeEntryService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    eventId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const response = await api.get<ApiResponse<TimeEntryWithEvent[]>>('/time-entries', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<TimeEntry>>(`/time-entries/${id}`);
    return response.data.data!;
  },

  async getActive() {
    const response = await api.get<ApiResponse<TimeEntry | null>>('/time-entries/active');
    return response.data.data;
  },

  async getSummary(period: 'daily' | 'weekly' | 'monthly' = 'daily', userId?: string) {
    const params: Record<string, string> = { period };
    if (userId) params.userId = userId;
    const response = await api.get<ApiResponse<TimeEntrySummary>>('/time-entries/summary', { params });
    return response.data.data!;
  },

  async clockIn(data?: ClockInRequest) {
    const response = await api.post<ApiResponse<TimeEntry>>('/time-entries/clock-in', data || {});
    return response.data.data!;
  },

  async clockOut() {
    const response = await api.post<ApiResponse<TimeEntry>>('/time-entries/clock-out', {});
    return response.data.data!;
  },

  async rfidToggle(data: RfidRequest) {
    const response = await api.post<ApiResponse<RfidResponse>>('/time-entries/rfid', data);
    return response.data.data!;
  },

  // Admin: Create manual time entry
  async create(data: {
    userId: string;
    clockIn: string;
    clockOut: string;
    eventId?: string | null;
    notes?: string | null;
  }) {
    const response = await api.post<ApiResponse<TimeEntryWithEvent>>('/time-entries', data);
    return response.data.data!;
  },

  // Admin: Update time entry
  async update(id: string, data: {
    clockIn?: string;
    clockOut?: string | null;
    eventId?: string | null;
    notes?: string | null;
  }) {
    const response = await api.put<ApiResponse<TimeEntryWithEvent>>(`/time-entries/${id}`, data);
    return response.data.data!;
  },

  // Admin: Delete time entry
  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/time-entries/${id}`);
    return response.data.data!;
  },
};
