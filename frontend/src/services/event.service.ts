import api from '../lib/axios';
import type { ApiResponse } from '../types';

export interface EventWithRelations {
  id: string;
  name: string;
  description: string;
  clientRequirements?: string;
  startDatetime: string;
  endDatetime: string;
  googleCalendarId?: string;
  createdBy: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  assignees?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  clientRequirements?: string | null;
  startDatetime: string;
  endDatetime: string;
  assigneeIds?: string[];
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  clientRequirements?: string | null;
  startDatetime?: string;
  endDatetime?: string;
  assigneeIds?: string[];
}

export const eventService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    assigneeId?: string;
  }) {
    const response = await api.get<ApiResponse<EventWithRelations[]>>('/events', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<EventWithRelations>>(`/events/${id}`);
    return response.data.data!;
  },

  async getUpcoming() {
    const response = await api.get<ApiResponse<EventWithRelations[]>>('/events/upcoming');
    return response.data.data!;
  },

  async create(data: CreateEventRequest) {
    const response = await api.post<ApiResponse<EventWithRelations>>('/events', data);
    return response.data.data!;
  },

  async update(id: string, data: UpdateEventRequest) {
    const response = await api.put<ApiResponse<EventWithRelations>>(`/events/${id}`, data);
    return response.data.data!;
  },

  async delete(id: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/events/${id}`);
    return response.data.data!;
  },
};
